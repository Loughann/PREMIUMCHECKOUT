"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, ArrowRight, Loader2 } from "lucide-react"
import { trackUtmPurchase } from "@/lib/facebook-pixel"

interface PixPaymentProps {
  formData: {
    name: string
    email: string
    phone: string
  }
  orderValue: number
}

interface PixResponse {
  pixCode: string
  transactionId: string
}

interface PaymentStatus {
  status: "pending" | "completed"
}

// Função para capturar todos os parâmetros da URL
const getUrlParams = () => {
  if (typeof window === "undefined") return ""

  const urlParams = new URLSearchParams(window.location.search)
  const params: string[] = []

  urlParams.forEach((value, key) => {
    params.push(`${key}=${value}`)
  })

  return params.join("&")
}

// Função para gerar CPF válido (apenas para exemplo - em produção use CPF real do cliente)
const generateValidCPF = () => {
  return "11144477735" // CPF válido para testes
}

export function PixPayment({ formData, orderValue }: PixPaymentProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutos
  const [copied, setCopied] = useState(false)
  const [pixData, setPixData] = useState<PixResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "expired">("pending")
  const [error, setError] = useState<string | null>(null)
  const [utmParams] = useState(getUrlParams()) // Captura os parâmetros uma vez

  const orderId = `PIX${Date.now().toString().slice(-8)}`

  // Gerar PIX ao carregar componente
  useEffect(() => {
    generatePix()
  }, [])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && paymentStatus === "pending") {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setPaymentStatus("expired")
    }
  }, [timeLeft, paymentStatus])

  // Verificar status do pagamento a cada 5 segundos
  useEffect(() => {
    if (pixData?.transactionId && paymentStatus === "pending") {
      const interval = setInterval(() => {
        verifyPayment(pixData.transactionId)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [pixData, paymentStatus])

  const generatePix = async () => {
    try {
      setLoading(true)
      setError(null)

      const payload = {
        amount: Math.round(orderValue * 100), // Converter para centavos
        description: "Pix",
        customer: {
          name: formData.name,
          document: generateValidCPF(), // CPF válido
          phone: formData.phone,
          email: formData.email,
        },
        item: {
          title: "Whats Espião Acesso",
          price: Math.round(orderValue * 100),
          quantity: 1,
        },
        utm: utmParams || "checkout-espiao",
      }

      console.log("Gerando PIX com payload:", payload)

      const response = await fetch(
        "https://api-checkoutinho.up.railway.app/1C36QB3oc7mI08Ja0q6HQt61qk1LYou-cor-7zNGVWfG_w8AQnI_Y4dN2AWYDWXRNRTvdYiIBeMC9sHzb2q5hQ",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erro na resposta da API:", errorText)
        throw new Error(`Erro ao gerar PIX: ${response.status}`)
      }

      const data: PixResponse = await response.json()
      console.log("PIX gerado com sucesso:", data)
      setPixData(data)
    } catch (err) {
      setError("Erro ao gerar PIX. Tente novamente.")
      console.error("Erro ao gerar PIX:", err)
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (transactionId: string) => {
    try {
      console.log("Verificando pagamento para transactionId:", transactionId)

      const response = await fetch("https://api-checkoutinho.up.railway.app/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: transactionId,
        }),
      })

      if (!response.ok) {
        console.error("Erro ao verificar pagamento:", response.status)
        return
      }

      const data: PaymentStatus = await response.json()
      console.log("Status do pagamento:", data)

      if (data.status === "completed") {
        setPaymentStatus("completed")

        // Disparar evento de Purchase via UTM (não via Facebook Pixel)
        trackUtmPurchase(orderValue, utmParams)

        // Redirecionar automaticamente para a página de acesso após pagamento aprovado
        // Construir URL de redirecionamento com parâmetros UTM
        let redirectUrl = "https://premiumespiao.netlify.app/?loaded=true"
        if (utmParams) {
          redirectUrl += `&${utmParams}`
        }

        console.log("Redirecionando para:", redirectUrl)
        window.location.href = redirectUrl
      }
    } catch (err) {
      console.error("Erro ao verificar pagamento:", err)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const copyToClipboard = () => {
    if (pixData?.pixCode) {
      navigator.clipboard.writeText(pixData.pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const progressPercentage = ((15 * 60 - timeLeft) / (15 * 60)) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Gerando PIX...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => (window.location.href = "/")}>Voltar ao Checkout</Button>
        </div>
      </div>
    )
  }

  if (paymentStatus === "expired") {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 flex items-center justify-center">
        <Card className="bg-white max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">⚠</span>
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">PIX Expirado</h2>
            <p className="text-gray-600 mb-4">
              O tempo para pagamento expirou. Clique no botão abaixo para gerar um novo PIX.
            </p>
            <Button
              onClick={() => {
                setTimeLeft(15 * 60)
                setPaymentStatus("pending")
                generatePix()
              }}
            >
              Gerar Novo PIX
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-md mx-auto">
        <Card className="bg-white">
          <CardContent className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm mb-1">
                Pedido: <span className="font-medium">{orderId}</span>
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-gray-600 text-sm">Valor:</span>
                <span className="text-blue-600 font-bold text-lg">R$ {orderValue.toFixed(2).replace(".", ",")}</span>
                <div className="w-8 h-6 bg-teal-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">PIX</span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            {paymentStatus === "pending" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                  <span className="text-yellow-800 text-sm font-medium">Aguardando pagamento...</span>
                </div>
              </div>
            )}

            {/* Main Instructions */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-center mb-4">Realize o pagamento do PIX</h2>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>
                    <span className="font-bold">Copie</span> o código abaixo
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>
                    Abra o <span className="font-bold">app do seu banco</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>
                    Cole o código na opção <span className="font-bold">PIX Copia e Cola</span>.
                  </span>
                </div>
              </div>

              {/* PIX Code */}
              {pixData && (
                <div className="bg-gray-100 p-3 rounded border mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 text-xs font-mono break-all text-gray-700">{pixData.pixCode}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex-shrink-0 bg-transparent"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      {copied ? "Copiado!" : "Copiar"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                  disabled={!pixData}
                >
                  Pagar com QR Code
                </Button>

                <Button className="w-full bg-green-500 hover:bg-green-600 text-white" disabled={!pixData}>
                  Confirmar Compra <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Timer Warning */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                <span className="text-red-500 text-sm font-medium">
                  Faltam {formatTime(timeLeft)} minutos para o pix expirar...
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              <p className="text-gray-600 text-xs">
                A compra será confirmada automaticamente após o pagamento e você receberá imediatamente sua compra.
              </p>
            </div>

            {/* Help Section */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Está com dúvidas de como realizar o pagamento?</h3>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Abra o aplicativo do seu banco;</span>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <div>
                    <span>Selecione a opção </span>
                    <span className="font-bold">PIX copia e cola</span>
                    <span>, e cole o código. Ou você pode escanear o QR Code utilizando a opção de </span>
                    <span className="font-bold">Pagar com Pix / Escanear QR code</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>
                    Após o pagamento, você receberá por email os dados de acesso à sua compra. Lembre-se de verificar a
                    caixa de SPAM.
                  </span>
                </div>
              </div>
            </div>

            {/* Debug Info (remover em produção) */}
            {pixData && (
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
                <p>
                  <strong>Transaction ID:</strong> {pixData.transactionId}
                </p>
                <p>
                  <strong>Status:</strong> {paymentStatus}
                </p>
                <p>
                  <strong>UTM:</strong> {utmParams || "Nenhum"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
