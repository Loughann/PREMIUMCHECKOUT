"use client"

import type * as React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation" // Importar useRouter

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Loader2, ShieldCheck, Lock, Clock, Square, Star } from "lucide-react"
import QRCode from "react-qr-code"
import { MatrixBackground } from "@/components/matrix-background"

// -------- TIPAGENS --------
interface Customer {
  name: string
  document: string
  phone: string
  email: string
}

interface Item {
  title: string
  price: number
  quantity: number
}

interface GeneratePixPayload {
  amount: number
  description: string
  customer: Customer
  item: Item
  utm: string
}

interface GeneratePixResponse {
  pixCode: string
  transactionId: string
}

interface VerifyPixPayload {
  paymentId: string
}

interface VerifyPixResponse {
  status: "pending" | "completed" | "failed"
}

// -------- FUNÇÕES DO PIXEL --------
const trackPixelEvent = (eventName: string, parameters?: any) => {
  if (typeof window !== "undefined" && (window as any).fbq) {
    console.log(`🔥 Disparando evento Pixel: ${eventName}`, parameters)
    ;(window as any).fbq("track", eventName, parameters)
  } else {
    console.warn("⚠️ Facebook Pixel não encontrado")
  }
}

// -------- COMPONENTE --------
export default function CheckoutPage() {
  const router = useRouter() // Inicializar useRouter
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed" | null>(null)
  const [isLoadingPix, setIsLoadingPix] = useState(false)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [purchaseEventFired, setPurchaseEventFired] = useState(false) // Flag para controlar o evento Purchase
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [customerEmail, setCustomerEmail] = useState("")

  const itemTitle = "ESPIÃO PREMIUM" // Nome do produto para a API
  const itemPrice = 9.9
  const totalAmount = 9.9

  const description = "Pagamento do ESPIÃO PREMIUM" // Descrição para a API

  async function handleGeneratePix() {
    if (!customerEmail) {
      alert("Por favor, insira seu e-mail.")
      return
    }

    setIsLoadingPix(true)
    setPixCode(null)
    setTransactionId(null)
    setPaymentStatus(null)
    setPurchaseEventFired(false) // Reset da flag

    // Evento: Usuário iniciou o processo de pagamento
    trackPixelEvent("InitiateCheckout", {
      value: totalAmount,
      currency: "BRL",
      content_name: itemTitle,
      content_category: "Digital Product",
      num_items: 1,
    })

    const payload: GeneratePixPayload = {
      amount: Math.round(totalAmount * 100),
      description,
      customer: {
        name: "Cliente Premium",
        document: "000.000.000-00",
        phone: "00000000000",
        email: customerEmail,
      },
      item: {
        title: itemTitle,
        price: Math.round(itemPrice * 100),
        quantity: 1,
      },
      utm: "checkout-v0",
    }

    try {
      const res = await fetch(
        "https://api-checkoutinho.up.railway.app/dS7qHk8CkcE98ysGlGebPpX0SQFo36b_T8lU5f5wUeVeKu7THWa43qO-kSh-Q_8EbY8PyveP5oRAqV5Ti34sOg",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )
      if (!res.ok) throw new Error(res.statusText)

      const data: GeneratePixResponse = await res.json()
      setPixCode(data.pixCode)
      setTransactionId(data.transactionId)
      setPaymentStatus("pending")

      // Evento: PIX gerado com sucesso (informações de pagamento adicionadas)
      trackPixelEvent("AddPaymentInfo", {
        value: totalAmount,
        currency: "BRL",
        content_name: itemTitle,
        payment_type: "PIX",
      })

      console.log("✅ PIX gerado com sucesso:", data.transactionId)
    } catch (err) {
      console.error("❌ Erro ao gerar PIX:", err)
      alert("Erro ao gerar PIX.")
      setPaymentStatus("failed")
    } finally {
      setIsLoadingPix(false)
    }
  }

  async function handleVerifyPix(paymentId: string) {
    setIsVerifyingPayment(true)
    console.log("🔍 Verificando pagamento:", paymentId)

    try {
      const res = await fetch("https://api-checkoutinho.up.railway.app/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId } as VerifyPixPayload),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data: VerifyPixResponse = await res.json()

      console.log("📊 Status do pagamento:", data.status)
      setPaymentStatus(data.status)

      // Evento: Pagamento aprovado - COMPRA CONFIRMADA (APENAS UMA VEZ)
      if (data.status === "completed" && !purchaseEventFired) {
        console.log("🎉 PAGAMENTO EFETUADO! Disparando evento Purchase ÚNICO")
        trackPixelEvent("Purchase", {
          value: totalAmount,
          currency: "BRL",
          content_name: itemTitle,
          content_category: "Digital Product",
          content_ids: [itemTitle],
          num_items: 1,
          transaction_id: paymentId,
        })
        setPurchaseEventFired(true) // Marca que o evento já foi disparado
        console.log("✅ Evento Purchase disparado com sucesso - não será disparado novamente")
      } else if (data.status === "completed" && purchaseEventFired) {
        console.log("⚠️ Pagamento já processado - evento Purchase não será disparado novamente")
      }
    } catch (err) {
      console.error("❌ Erro ao verificar pagamento:", err)
      setPaymentStatus("failed")
    } finally {
      setIsVerifyingPayment(false)
    }
  }

  useEffect(() => {
    // Evento: Página carregada (ViewContent)
    trackPixelEvent("ViewContent", {
      content_name: itemTitle,
      content_category: "Digital Product",
      value: totalAmount,
      currency: "BRL",
    })

    if (transactionId && paymentStatus === "pending") {
      console.log("⏰ Iniciando verificação automática de pagamento a cada 4 segundos")
      intervalRef.current = setInterval(() => handleVerifyPix(transactionId), 4000) // 4000ms = 4 segundos
    }
    if (paymentStatus === "completed") {
      console.log("✅ Redirecionando para página de obrigado")
      router.push("/thank-you")
      if (intervalRef.current) clearInterval(intervalRef.current)
    } else if (paymentStatus !== "pending" && intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [transactionId, paymentStatus, router, itemTitle, totalAmount])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <MatrixBackground />

      <Card className="w-full max-w-md shadow-lg rounded-lg bg-card text-card-foreground relative z-10">
        <CardContent className="p-6 space-y-8">
          {/* HEADER */}
          <div className="text-center">
            <h1 className="text-6xl font-extrabold uppercase text-[#00BFFF] text-glow-blue mb-2">{"ESPIÃO PREMIUM"}</h1>
            <p className="text-4xl font-extrabold text-primary-blue mb-2">
              R$ {totalAmount.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-sm text-muted">Desconto especial por tempo limitado</p>
          </div>

          {/* BENEFÍCIOS */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, text: "Pagamento Seguro" },
              { icon: Lock, text: "100% Anônimo" },
              { icon: Clock, text: "Acesso Imediato" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex flex-col items-center p-3 bg-muted/20 rounded-lg border border-border text-center"
              >
                <Icon className="h-6 w-6 text-primary-blue mb-1" />
                <span className="text-xs text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>

          {/* ESTATÍSTICAS */}
          <div className="text-center space-y-4">
            <p className="text-foreground font-semibold">
              Mais de 75.000 pessoas já descobriram a verdade usando nosso APP Oficial
            </p>
            <div className="flex justify-around">
              <Stat value="75k+" label="Relatórios gerados" />
              <Stat value="99%" label="Taxa de sucesso" />
              <Stat
                value={
                  <>
                    4.9
                    <Star className="inline h-5 w-5 fill-primary-blue text-primary-blue -mt-1 ml-0.5" />
                  </>
                }
                label="Avaliação média"
              />
            </div>
          </div>

          {/* INFO PAGAMENTO */}
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center mb-4">
              <Square className="h-5 w-5 fill-primary-blue text-primary-blue mr-2" />
              Informações de Pagamento
            </h2>

            <Label className="text-foreground font-medium mb-2 block">Método de Pagamento</Label>
            <div className="w-full flex justify-start items-center border border-border font-normal py-2 px-3 rounded-md bg-white text-black mt-1">
              <Square className="h-5 w-5 fill-primary-blue text-primary-blue mr-3" />
              PIX - Pagamento Instantâneo
            </div>
          </div>

          {/* QR CODE OU INSTRUÇÃO */}
          <div className="flex items-center justify-center min-h-[150px] bg-muted/20 border border-border rounded-lg p-4">
            {isLoadingPix ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
            ) : pixCode ? (
              <div className="space-y-3 w-full">
                <p className="text-center text-muted-foreground text-sm">
                  Escaneie o código QR com seu app do banco ou copie o código PIX
                </p>
                <Button
                  variant="outline"
                  className="w-full justify-center border border-border font-semibold py-2 px-4 rounded-md bg-white text-black"
                  onClick={() => {
                    navigator.clipboard.writeText(pixCode)
                    alert("Código Pix copiado!")
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Código PIX
                </Button>

                <div className="flex flex-col items-center">
                  <QRCode value={pixCode} size={150} level="H" />
                  <p className="text-sm text-muted-foreground mt-1">Válido por 30 minutos</p>

                  <div className="flex items-center justify-center border border-border rounded-full px-4 py-2 mt-2 bg-muted/20">
                    <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">
                      Status:{" "}
                      {paymentStatus === "pending"
                        ? "Aguardando Pagamento"
                        : paymentStatus === "completed"
                          ? "Pagamento Aprovado"
                          : paymentStatus === "failed"
                            ? "Pagamento Falhou"
                            : "Aguardando"}
                    </span>
                  </div>

                  <div className="text-center mt-4 p-3 bg-muted/10 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">ID da Transação</p>
                    <p className="text-base font-semibold break-all text-primary-blue">{transactionId}</p>
                  </div>

                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-4">
                    <li>O pagamento será confirmado automaticamente</li>
                    <li>Após o pagamento, você receberá o acesso por e-mail</li>
                    <li>Em caso de dúvidas, guarde o ID da transação</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm">
                <div className="w-24 h-24 bg-muted/30 rounded-md mx-auto mb-2" />
                Preencha seu e-mail e clique em "Gerar PIX" para continuar
              </div>
            )}
          </div>

          {/* COBRANÇA */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">Envio do acesso premium</h2>
            <Label htmlFor="customerEmail" className="text-foreground font-medium">
              E-mail *
            </Label>
            <Input
              id="customerEmail"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
              className={`bg-white border-border text-black mt-1 placeholder:text-gray-600 ${
                !customerEmail && !pixCode && paymentStatus !== "completed" ? "border-red-500" : ""
              }`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Precisamos apenas do seu e-mail para enviar o acesso premium de forma segura e anônima
            </p>
          </div>

          {/* BOTÃO PRINCIPAL */}
          <Button
            onClick={handleGeneratePix}
            disabled={isLoadingPix || paymentStatus === "completed" || !customerEmail}
            className={`w-full py-6 text-lg font-bold bg-gradient-to-r from-[#00BFFF] to-[#009ACD] hover:from-[#00BFFF]/90 hover:to-[#009ACD]/90 text-white ${
              !isLoadingPix && paymentStatus !== "completed" && customerEmail ? "animate-pulse-blue" : ""
            } text-black`}
          >
            {isLoadingPix ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando PIX...
              </>
            ) : paymentStatus === "completed" ? (
              "Pagamento Concluído"
            ) : (
              `Gerar PIX - R$ ${totalAmount.toFixed(2).replace(".", ",")}`
            )}
          </Button>

          {/* SEÇÃO DE SEGURANÇA */}
          <div className="text-center mt-4">
            <p className="text-muted-foreground text-sm flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-muted mr-1" />
              Pagamento 100% seguro e criptografado
            </p>
            <p className="text-xs text-muted-foreground mt-1">Seus dados estão protegidos por SSL de 256 bits</p>
          </div>

          {/* SEÇÃO DE DEPOIMENTOS */}
          <div className="w-full space-y-6 pt-4">
            <h2 className="text-xl font-bold text-foreground flex items-center">
              <Star className="h-6 w-6 fill-yellow-500 text-yellow-500 mr-2" />O que nossos clientes dizem
            </h2>
            <TestimonialCard
              name="Marina M."
              text="Com o relatório normal, eu já tinha minhas dúvidas confirmadas… mas o Premium me deu detalhes que mudaram tudo. Mostrou até os horários das chamadas e uns prints que ele achou q tinham sumido. Valeu cada centavo."
            />
            <TestimonialCard
              name="Bruna F."
              text="Sou daquelas que não faz nada pela metade. Fiz o upgrade e não me arrependo. O Premium mostrou conversas arquivadas, fotos antigas… tudo q ele tentou esconder. Hoje, durmo tranquila. Ele que deve estar com medo"
            />
            <TestimonialCard
              name="Manoela P."
              text="O relatório já tinha me mostrado bastante, mas o ESPIÃO PREMIUM foi um tapa de realidade. Sério, foi como olhar por uma janela que ele mantinha fechada. Descobri uma segunda vida que ele levava, tuudo detalhado..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/** Componente auxiliar das estatísticas */
function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-primary-blue text-3xl font-bold">{value}</span>
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  )
}

/** Componente auxiliar para os depoimentos */
function TestimonialCard({ name, text }: { name: string; text: string }) {
  return (
    <Card className="p-4 bg-card shadow-sm rounded-lg border border-border">
      <CardContent className="p-0">
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
          ))}
          <span className="font-semibold text-foreground ml-2">{name}</span>
        </div>
        <p className="text-muted-foreground italic text-sm">"{text}"</p>
      </CardContent>
    </Card>
  )
}
