"use client"

import type * as React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation" // Importar useRouter

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

// -------- COMPONENTE --------
export default function CheckoutPage() {
  const router = useRouter() // Inicializar useRouter
  const searchParams = useSearchParams()
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed" | null>(null)
  const [isLoadingPix, setIsLoadingPix] = useState(false)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const bonusTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [customerEmail, setCustomerEmail] = useState("")

  const itemTitle = "ESPIÃO PREMIUM" // Nome do produto para a API
  const itemPrice = 19.9 // Alterado de 9.9 para 19.9
  const totalAmount = 19.9 // Alterado de 9.9 para 19.9

  const description = "Pagamento do ESPIÃO PREMIUM" // Descrição para a API

  // Adicionar novos estados para o modal de orderbumps
  const [showOrderBumps, setShowOrderBumps] = useState(false)
  // Atualizar os estados dos orderbumps
  const [selectedOrderBumps, setSelectedOrderBumps] = useState({
    nomeReal: false,
    fotosVideos: false,
    protecaoInvisivel: false,
  })

  // Adicionar um novo estado para controlar o modal de instruções:
  const [showInstructions, setShowInstructions] = useState(false)

  // Estado para o countdown de escassez
  const [timeLeft, setTimeLeft] = useState(360) // Alterado de 942 para 360 (6 minutos)
  // Remover o estado isUrgent pois não será mais usado
  // const [isUrgent, setIsUrgent] = useState(false)

  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  // Adicionar um novo estado para controlar o pop-up de bônus após os outros estados:
  const [showBonusPopup, setShowBonusPopup] = useState(false)
  const [bonusTimeLeft, setBonusTimeLeft] = useState(300) // 5 minutos em segundos
  const [orderBumpTimeLeft, setOrderBumpTimeLeft] = useState(180) // 3 minutos em segundos

  // Adicionar após os outros estados
  const [bonusPopupShown, setBonusPopupShown] = useState(false)
  const [bonusPopupShownAfterCopy, setBonusPopupShownAfterCopy] = useState(false)

  const [pixExpirationTime, setPixExpirationTime] = useState(600) // 10 minutos em segundos

  // Modificar a função handleGeneratePix para mostrar o modal primeiro
  async function handleGeneratePix() {
    if (!customerEmail) {
      alert("Por favor, insira seu e-mail.")
      return
    }

    // Mostrar modal de orderbumps primeiro
    setOrderBumpTimeLeft(180) // Reset para 3 minutos
    setShowOrderBumps(true)
  }

  // Nova função para processar o PIX após seleção dos orderbumps
  // Atualizar a função processPixGeneration para usar os novos nomes
  async function processPixGeneration() {
    setShowOrderBumps(false)
    setIsLoadingPix(true)
    setPixCode(null)
    setTransactionId(null)
    setPaymentStatus(null)
    setPixExpirationTime(600) // Reset para 10 minutos

    // Calcular valor total baseado nos orderbumps selecionados
    let finalAmount = totalAmount
    if (selectedOrderBumps.nomeReal) {
      finalAmount += 9.9
    }
    if (selectedOrderBumps.fotosVideos) {
      finalAmount += 19.9
    }
    if (selectedOrderBumps.protecaoInvisivel) {
      finalAmount += 7.9
    }

    const payload: GeneratePixPayload = {
      amount: Math.round(finalAmount * 100),
      description,
      customer: {
        name: "Cliente Espião Premium",
        document: "000.000.000-00",
        phone: "00000000000",
        email: customerEmail,
      },
      item: {
        title: itemTitle,
        price: Math.round(finalAmount * 100),
        quantity: 1,
      },
      utm: searchParams.toString() || "checkout-v0",
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

      // Dispara evento AddToCart
      // if (typeof window !== "undefined" && (window as any).fbq) {
      //   ;(window as any).fbq("track", "AddToCart", {
      //     value: finalAmount,
      //     currency: "BRL",
      //     content_name: "ESPIÃO PREMIUM",
      //   })
      // }
    } catch (err) {
      console.error(err)
      alert("Erro ao gerar PIX.")
      setPaymentStatus("failed")
    } finally {
      setIsLoadingPix(false)
    }
  }

  async function handleVerifyPix(paymentId: string) {
    setIsVerifyingPayment(true)
    try {
      const res = await fetch("https://api-checkoutinho.up.railway.app/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId } as VerifyPixPayload),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data: VerifyPixResponse = await res.json()
      setPaymentStatus(data.status)

      // Dispara o evento Purchase ao confirmar o pagamento como concluído
      // if (data.status === "completed" && typeof window !== "undefined" && (window as any).fbq) {
      //   // Calcular valor total incluindo orderbumps
      //   const finalAmount =
      //     totalAmount +
      //     (selectedOrderBumps.investigacao ? 9.9 : 0) +
      //     (selectedOrderBumps.localizacao ? 6.9 : 0) +
      //     (selectedOrderBumps.relatorio ? 14.9 : 0)
      //   ;(window as any).fbq("track", "Purchase", {
      //     value: finalAmount,
      //     currency: "BRL",
      //     content_name: "ESPIÃO PREMIUM",
      //     content_ids: ["espiao-premium"],
      //     content_type: "product",
      //   })
      // }
    } catch (err) {
      console.error(err)
      setPaymentStatus("failed")
    } finally {
      setIsVerifyingPayment(false)
    }
  }

  useEffect(() => {
    // Dispara o evento InitiateCheckout quando o componente é montado
    if (typeof window !== "undefined" && (window as any).fbq) {
      ;(window as any).fbq("track", "InitiateCheckout")
    }

    if (transactionId && paymentStatus === "pending") {
      intervalRef.current = setInterval(() => handleVerifyPix(transactionId), 4000)
    }
    if (paymentStatus === "completed") {
      // Redireciona diretamente para o link externo quando o pagamento é concluído
      window.location.href = "https://premiumespiao.netlify.app"
      if (intervalRef.current) clearInterval(intervalRef.current)
    } else if (paymentStatus !== "pending" && intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [transactionId, paymentStatus, router])

  // Simplificar o useEffect do countdown removendo a lógica de urgência
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Função para iniciar o timer do pop-up de bônus
  const startBonusTimer = () => {
    if (bonusTimerRef.current) {
      clearTimeout(bonusTimerRef.current)
    }

    bonusTimerRef.current = setTimeout(() => {
      // Verificar se o usuário ainda está na página e não está com o modal de instruções aberto
      if (document.visibilityState === "visible" && !showInstructions && !bonusPopupShown) {
        setBonusTimeLeft(300) // Reset para 5 minutos
        setShowBonusPopup(true)
        setBonusPopupShown(true) // Marcar que o pop-up foi mostrado
      }
    }, 12000) // 12 segundos
  }

  // Função para parar o timer do pop-up de bônus
  const stopBonusTimer = () => {
    if (bonusTimerRef.current) {
      clearTimeout(bonusTimerRef.current)
      bonusTimerRef.current = null
    }
  }

  // Pop-up de bônus com controle de visibilidade da página
  useEffect(() => {
    if (pixCode && paymentStatus === "pending" && !showInstructions && !bonusPopupShown && !bonusPopupShownAfterCopy) {
      // Iniciar o timer apenas se a página estiver visível
      if (document.visibilityState === "visible") {
        startBonusTimer()
      }

      // Listener para mudanças de visibilidade da página
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          // Página ficou visível - iniciar timer se não estiver com modal de instruções aberto
          if (!showInstructions && !showBonusPopup && !bonusPopupShown && !bonusPopupShownAfterCopy) {
            startBonusTimer()
          }
        } else {
          // Página ficou oculta - parar timer
          stopBonusTimer()
        }
      }

      document.addEventListener("visibilitychange", handleVisibilityChange)

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange)
        stopBonusTimer()
      }
    } else {
      stopBonusTimer()
    }
  }, [pixCode, paymentStatus, showInstructions, showBonusPopup, bonusPopupShown, bonusPopupShownAfterCopy])

  // Countdown do pop-up de bônus
  useEffect(() => {
    if (showBonusPopup && bonusTimeLeft > 0) {
      const timer = setInterval(() => {
        setBonusTimeLeft((prev) => {
          if (prev <= 1) {
            setShowBonusPopup(false) // Fecha o pop-up quando o tempo acaba
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showBonusPopup, bonusTimeLeft])

  // Countdown do orderbump
  useEffect(() => {
    if (showOrderBumps && orderBumpTimeLeft > 0) {
      const timer = setInterval(() => {
        setOrderBumpTimeLeft((prev) => {
          if (prev <= 1) {
            setShowOrderBumps(false) // Fecha o modal quando o tempo acaba
            processPixGeneration() // Continua sem orderbumps
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showOrderBumps, orderBumpTimeLeft])

  // Countdown do PIX (10 minutos)
  useEffect(() => {
    if (pixCode && pixExpirationTime > 0) {
      const timer = setInterval(() => {
        setPixExpirationTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [pixCode, pixExpirationTime])

  // Função para formatar o tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Função para formatar o tempo do bônus
  const formatBonusTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Função para formatar o tempo do orderbump
  const formatOrderBumpTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Função para formatar o tempo do PIX
  const formatPixTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Função para calcular ofertas disponíveis da primeira oferta (mais rápida)
  // Atualizar as funções de cálculo de ofertas disponíveis
  const getAvailableOffersNomeReal = () => {
    const totalTime = 180 // 3 minutos
    const timeElapsed = totalTime - orderBumpTimeLeft

    let offersReduction = 0

    if (timeElapsed <= 30) {
      offersReduction = Math.floor(timeElapsed / 6)
    } else {
      const fastReduction = Math.floor(30 / 6)
      const slowTimeElapsed = timeElapsed - 30
      const slowReduction = Math.floor(slowTimeElapsed / 10)
      offersReduction = fastReduction + slowReduction
    }

    const availableOffers = Math.max(1, 9 - offersReduction)
    return availableOffers
  }

  const getAvailableOffersFotosVideos = () => {
    const totalTime = 180 // 3 minutos
    const timeElapsed = totalTime - orderBumpTimeLeft

    let offersReduction = 0

    if (timeElapsed <= 50) {
      offersReduction = Math.floor(timeElapsed / 10)
    } else {
      const fastReduction = Math.floor(50 / 10)
      const slowTimeElapsed = timeElapsed - 50
      const slowReduction = Math.floor(slowTimeElapsed / 25)
      offersReduction = fastReduction + slowReduction
    }

    const availableOffers = Math.max(1, 9 - offersReduction)
    return availableOffers
  }

  const getAvailableOffersProtecaoInvisivel = () => {
    const totalTime = 180 // 3 minutos
    const timeElapsed = totalTime - orderBumpTimeLeft

    let offersReduction = 0

    if (timeElapsed <= 45) {
      offersReduction = Math.floor(timeElapsed / 9)
    } else {
      const fastReduction = Math.floor(45 / 9)
      const slowTimeElapsed = timeElapsed - 45
      const slowReduction = Math.floor(slowTimeElapsed / 15)
      offersReduction = fastReduction + slowReduction
    }

    const availableOffers = Math.max(1, 9 - offersReduction)
    return availableOffers
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10 pt-20">
      {/* BARRA DE ESCASSEZ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border p-3 text-center">
        <div className="flex flex-col items-center justify-center">
          <p className="text-base font-semibold text-blue-400 text-glow-blue flex items-center justify-center">
            <Clock className="h-5 w-5 mr-2" />
            Relatório completo se encerra em {formatTime(timeLeft)} minutos
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Relatório completo pronto! Realize o pagamento para receber
          </p>
        </div>
      </div>
      <MatrixBackground />

      <Card className="w-full max-w-md shadow-lg rounded-lg bg-card text-card-foreground relative z-10">
        <CardContent className="p-6 space-y-8">
          {/* HEADER */}
          <div className="text-center">
            <h1 className="text-6xl font-extrabold uppercase text-cyan-400 text-glow-cyan mb-2">{"ESPIÃO PREMIUM"}</h1>{" "}
            {/* Título exibido */}
            <p className="text-4xl font-extrabold text-cyan-500 mb-2">R$ {totalAmount.toFixed(2).replace(".", ",")}</p>
            <p className="text-sm text-muted">Desconto especial até {new Date().toLocaleDateString("pt-BR")}</p>
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
                <Icon className="h-6 w-6 text-cyan-500 mb-1" />
                <span className="text-xs text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>

          {/* ESTATÍSTICAS */}
          <div className="text-center space-y-4">
            <p className="text-foreground font-semibold text-center">
              Mais de 75.000 pessoas já descobriram a verdade usando nosso APP{" "}
              <span className="inline-flex items-center gap-1">
                Oficial
                <img src="/whatsapp-icon.webp" alt="WhatsApp" className="h-[0.9em] w-[0.9em]" />
              </span>
            </p>
            <div className="flex justify-around">
              <Stat value="75k+" label="Relatórios gerados" />
              <Stat value="99%" label="Taxa de sucesso" />
              <Stat
                value={
                  <>
                    4.9
                    <Star className="inline h-5 w-5 fill-cyan-500 text-cyan-500 -mt-1 ml-0.5" />
                  </>
                }
                label="Avaliação média"
              />
            </div>
          </div>

          {/* INFO PAGAMENTO */}
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center mb-4">
              <Square className="h-5 w-5 fill-blue-500 text-blue-500 mr-2" />
              Informações de Pagamento
            </h2>

            <Label className="text-foreground font-medium mb-2 block">Método de Pagamento</Label>
            {/* Ajustado para ter a mesma aparência do campo de e-mail */}
            <div className="w-full flex justify-start items-center border border-border font-normal py-2 px-3 rounded-md bg-white text-black mt-1">
              <Square className="h-5 w-5 fill-blue-500 text-blue-500 mr-3" />
              PIX - Pagamento Instantâneo
            </div>
          </div>

          {/* QR CODE OU INSTRUÇÃO */}
          <div className="flex items-center justify-center min-h-[150px] bg-muted/20 border border-border rounded-lg p-4">
            {isLoadingPix ? (
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            ) : pixCode ? (
              <div className="space-y-3 w-full">
                {/* Novas informações e botão de copiar */}
                <p className="text-center text-muted-foreground text-sm">
                  Escaneie o código QR com seu app do banco ou copie o código PIX
                </p>
                {pixCode && (
                  <Button
                    variant="ghost"
                    className="w-full hover:text-blue-600 text-sm underline mt-2 text-[rgba(37,211,102,1)]"
                    onClick={() => setShowInstructions(true)}
                  >
                    Como fazer pagamento?
                  </Button>
                )}
                {/* Fim das novas informações */}

                <div className="flex flex-col items-center">
                  <QRCode value={pixCode} size={150} level="H" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Expira em {formatPixTime(pixExpirationTime)} minutos.
                  </p>
                  {/* Atualizar também a seção do QR Code para usar os novos valores */}
                  <p className="text-lg font-bold text-blue-400 mt-2">
                    Valor: R${" "}
                    {(
                      totalAmount +
                      (selectedOrderBumps.nomeReal ? 9.9 : 0) +
                      (selectedOrderBumps.fotosVideos ? 19.9 : 0) +
                      (selectedOrderBumps.protecaoInvisivel ? 7.9 : 0)
                    )
                      .toFixed(2)
                      .replace(".", ",")}
                  </p>
                  {/* Novo elemento de status */}
                  <div className="flex items-center justify-center border border-border rounded-full px-4 py-2 mt-2 bg-muted/20">
                    <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Status: Aguardando Pagamento</span>
                  </div>
                  {/* Fim do novo elemento de status */}
                  <Button
                    variant="outline"
                    className="w-full justify-center border border-border font-semibold py-2 px-4 rounded-md bg-white text-black animate-pulse mt-4"
                    onClick={() => {
                      navigator.clipboard.writeText(pixCode)
                      alert("Código Pix copiado!")

                      // Iniciar timer para mostrar pop-up após copiar (apenas se ainda não foi mostrado)
                      if (!bonusPopupShown && !bonusPopupShownAfterCopy) {
                        setBonusPopupShownAfterCopy(true)
                        setTimeout(() => {
                          if (document.visibilityState === "visible" && !showInstructions && !showBonusPopup) {
                            setBonusTimeLeft(300) // Reset para 5 minutos
                            setShowBonusPopup(true)
                            setBonusPopupShown(true) // Marcar que o pop-up foi mostrado
                          }
                        }, 7000) // 7 segundos após copiar
                      }
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Código PIX
                  </Button>

                  <div className="text-center mt-4 p-3 bg-muted/10 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">ID da Transação</p>
                    <p className="text-base font-semibold break-all text-blue-400">{transactionId}</p>
                  </div>

                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-4">
                    <li>O pagamento será confirmado automaticamente</li>
                    <li>Após o pagamento, você receberá o relatório por e-mail</li>
                    <li>Em caso de dúvidas, guarde o ID da transação</li>
                    <li>Satisfação com relatório ou dinheiro de volta</li>
                    <li>Relatório completo válido por tempo limitado</li>
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
            <h2 className="text-xl font-bold text-foreground mb-3">Envio do relatório completo</h2>
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
              disabled={pixCode !== null} // Bloqueia o campo quando o PIX é gerado
              className={`bg-white border-border text-black mt-1 placeholder:text-gray-600 ${
                !customerEmail && !pixCode && paymentStatus !== "completed" ? "border-red-500" : ""
              } ${pixCode !== null ? "opacity-50 cursor-not-allowed" : ""}`} // Adiciona estilo visual quando bloqueado
            />
            <p className="text-xs text-muted-foreground mt-1">
              Precisamos apenas do seu e-mail para enviar o relatório completo de forma segura e anônima
            </p>
          </div>

          {/* BOTÃO PRINCIPAL */}
          <Button
            onClick={handleGeneratePix}
            disabled={isLoadingPix || paymentStatus === "completed" || !customerEmail || pixCode !== null} // Adiciona pixCode !== null
            className={`w-full py-6 text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white ${
              !isLoadingPix && paymentStatus !== "completed" && customerEmail && pixCode === null
                ? "animate-pulse-blue"
                : ""
            } text-white`}
          >
            {isLoadingPix ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando PIX...
              </>
            ) : paymentStatus === "completed" ? (
              "Pagamento Concluído"
            ) : pixCode !== null ? (
              "Aguardando o pagamento..."
            ) : (
              `Gerar PIX - R$ ${totalAmount.toFixed(2).replace(".", ",")}`
            )}
          </Button>

          {/* SEÇÃO DE SEGURANÇA AGORA DENTRO DO CARD */}
          <div className="text-center mt-4">
            <p className="text-muted-foreground text-sm flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-muted mr-1" />
              Pagamento 100% seguro e criptografado
            </p>
            <p className="text-xs text-muted-foreground mt-1">Seus dados estão protegidos por SSL de 256 bits</p>
          </div>

          {/* SEÇÃO DE DEPOIMENTOS AGORA DENTRO DO CARD */}
          <div className="w-full space-y-6 pt-4">
            <h2 className="text-2xl font-bold text-center text-blue-400 text-glow-blue">O que nossos clientes dizem</h2>
            <TestimonialCarousel />
          </div>
        </CardContent>
      </Card>
      {showInstructions && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-background text-foreground max-h-[90vh] overflow-y-auto border border-border">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-blue-400 text-glow-blue">💡 Como fazer o pagamento PIX</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInstructions(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/20 border border-border rounded-lg p-4">
                  <div className="space-y-3 text-sm text-foreground">
                    <div className="flex items-start space-x-3">
                      <span className="bg-blue-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <p className="font-semibold">Abra o app do seu banco</p>
                        <p className="text-muted-foreground">Nubank, Inter, Itaú, Bradesco, Santander, etc.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="bg-blue-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <p className="font-semibold">Procure a opção "PIX"</p>
                        <p className="text-muted-foreground">Geralmente fica no menu principal</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="bg-blue-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <p className="font-semibold">Selecione "PIX Copia e Cola"</p>
                        <p className="text-muted-foreground">Ou "Pagar com código PIX"</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="bg-blue-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        4
                      </span>
                      <div>
                        <p className="font-semibold">Cole o código PIX</p>
                        <p className="text-muted-foreground">Use o botão abaixo para copiar</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="bg-blue-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <div>
                        <p className="font-semibold text-blue-400">Confirme o pagamento</p>
                        <p className="text-muted-foreground">Verifique o valor e confirme</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(pixCode!)
                    alert("Código PIX copiado!")

                    // Iniciar timer para mostrar pop-up após copiar (apenas se ainda não foi mostrado)
                    if (!bonusPopupShown && !bonusPopupShownAfterCopy) {
                      setBonusPopupShownAfterCopy(true)
                      setTimeout(() => {
                        if (document.visibilityState === "visible" && !showInstructions && !showBonusPopup) {
                          setBonusTimeLeft(300) // Reset para 5 minutos
                          setShowBonusPopup(true)
                          setBonusPopupShown(true) // Marcar que o pop-up foi mostrado
                        }
                      }, 7000) // 7 segundos após copiar
                    }
                  }}
                  className="w-full py-3 text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white animate-pulse-blue"
                >
                  <Copy className="h-5 w-5 mr-2" />
                  Copiar Código PIX
                </Button>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Após copiar, volte para o app do seu banco e cole o código
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Substituir todo o conteúdo do modal de orderbumps por: */}
      {showOrderBumps && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center p-2 z-50 overflow-y-auto">
          <Card className="w-full max-w-md bg-card text-card-foreground mt-4 mb-4">
            <CardContent className="p-4 space-y-4">
              {/* Barra de escassez no topo */}
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-4 w-4 text-red-400 mr-2" />
                  <span className="text-red-400 font-bold text-sm">
                    Ofertas especiais acabam em {formatOrderBumpTime(orderBumpTimeLeft)} minutos
                  </span>
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-xl font-bold text-red-400 text-glow-red mb-1">🎯 OFERTA ESPECIAL!</h2>
                <p className="text-muted-foreground text-xs">Aproveite essas ofertas exclusivas antes de finalizar</p>
              </div>

              {/* Primeiro OrderBump - Relatório com Nome Real */}
              <div className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="nomeReal"
                    checked={selectedOrderBumps.nomeReal}
                    onChange={(e) =>
                      setSelectedOrderBumps((prev) => ({
                        ...prev,
                        nomeReal: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor="nomeReal" className="cursor-pointer">
                      <h3 className="font-bold text-foreground text-lg leading-tight">📋 Relatório com Nome Real</h3>
                      <p className="text-muted-foreground text-sm mt-1 leading-tight">
                        Quer saber quem é aquele número desconhecido? Descubra o nome real e outras informações da
                        pessoa envolvida.
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-muted-foreground line-through text-xs">R$ 19,90</span>
                        <span className="text-red-500 font-bold text-lg">R$ 9,90</span>
                        <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded">50% OFF</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center bg-red-500/20 border border-red-500/50 rounded px-2 py-1">
                          <span className="text-red-400 text-xs font-bold">
                            🔥 Restam apenas {getAvailableOffersNomeReal()}/10 ofertas disponíveis
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Segundo OrderBump - Fotos e Videos Secretos */}
              <div className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="fotosVideos"
                    checked={selectedOrderBumps.fotosVideos}
                    onChange={(e) =>
                      setSelectedOrderBumps((prev) => ({
                        ...prev,
                        fotosVideos: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor="fotosVideos" className="cursor-pointer">
                      <h3 className="font-bold text-foreground text-lg leading-tight">
                        📸 Fotos e Videos Secretos por 30 Dias
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1 leading-tight">
                        Receba relatórios semanais e mensal com novos acessos e descobertas. Tudo isso sem levantar
                        suspeitas.
                      </p>
                      <p className="text-cyan-400 text-xs mt-1 font-semibold">
                        🔐 Ideal pra quem quer monitoramento constante.
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-muted-foreground line-through text-xs">R$ 39,90</span>
                        <span className="text-red-500 font-bold text-lg">R$ 19,90</span>
                        <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded">50% OFF</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center bg-red-500/20 border border-red-500/50 rounded px-2 py-1">
                          <span className="text-red-400 text-xs font-bold">
                            🔥 Restam apenas {getAvailableOffersFotosVideos()}/10 ofertas disponíveis
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Terceiro OrderBump - Proteção Invisível */}
              <div className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="protecaoInvisivel"
                    checked={selectedOrderBumps.protecaoInvisivel}
                    onChange={(e) =>
                      setSelectedOrderBumps((prev) => ({
                        ...prev,
                        protecaoInvisivel: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor="protecaoInvisivel" className="cursor-pointer">
                      <h3 className="font-bold text-foreground text-lg leading-tight">🛡️ Proteção Invisível</h3>
                      <p className="text-muted-foreground text-sm mt-1 leading-tight">
                        Evite rastreamento ou bloqueios. Com esse modo ativado, sua investigação fica 100% anônima. Nem
                        ele, nem ninguém vai saber que foi investigado.
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-muted-foreground line-through text-xs">R$ 15,90</span>
                        <span className="text-red-500 font-bold text-lg">R$ 7,90</span>
                        <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded">50% OFF</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center bg-red-500/20 border border-red-500/50 rounded px-2 py-1">
                          <span className="text-red-400 text-xs font-bold">
                            🔥 Restam apenas {getAvailableOffersProtecaoInvisivel()}/10 ofertas disponíveis
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Resumo do pedido - Compacto */}
              <div className="bg-muted/20 rounded-lg p-3">
                <h4 className="font-bold text-foreground mb-2 text-sm">Resumo:</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>ESPIÃO PREMIUM</span>
                    <span>R$ {totalAmount.toFixed(2).replace(".", ",")}</span>
                  </div>
                  {selectedOrderBumps.nomeReal && (
                    <div className="flex justify-between text-red-500">
                      <span>+ Relatório com Nome Real</span>
                      <span>R$ 9,90</span>
                    </div>
                  )}
                  {selectedOrderBumps.fotosVideos && (
                    <div className="flex justify-between text-red-500">
                      <span>+ Fotos e Videos por 30 Dias</span>
                      <span>R$ 19,90</span>
                    </div>
                  )}
                  {selectedOrderBumps.protecaoInvisivel && (
                    <div className="flex justify-between text-red-500">
                      <span>+ Proteção Invisível</span>
                      <span>R$ 7,90</span>
                    </div>
                  )}
                  <hr className="border-border" />
                  <div className="flex justify-between font-bold text-sm">
                    <span>Total:</span>
                    <span className="text-blue-500">
                      R${" "}
                      {(
                        totalAmount +
                        (selectedOrderBumps.nomeReal ? 9.9 : 0) +
                        (selectedOrderBumps.fotosVideos ? 19.9 : 0) +
                        (selectedOrderBumps.protecaoInvisivel ? 7.9 : 0)
                      )
                        .toFixed(2)
                        .replace(".", ",")}
                    </span>
                  </div>
                  {/* Seção de economia compacta */}
                  {(selectedOrderBumps.nomeReal ||
                    selectedOrderBumps.fotosVideos ||
                    selectedOrderBumps.protecaoInvisivel) && (
                    <>
                      <hr className="border-border" />
                      <div className="flex justify-between text-yellow-500 font-semibold text-xs">
                        <span>💰 Economia:</span>
                        <span>
                          R${" "}
                          {(
                            (selectedOrderBumps.nomeReal ? 10.0 : 0) +
                            (selectedOrderBumps.fotosVideos ? 20.0 : 0) +
                            (selectedOrderBumps.protecaoInvisivel ? 8.0 : 0)
                          )
                            .toFixed(2)
                            .replace(".", ",")}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Botões compactos */}
              <div className="space-y-2">
                <Button
                  onClick={processPixGeneration}
                  className="w-full py-3 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white animate-pulse-blue"
                >
                  🚀 CONTINUAR COM OFERTAS
                </Button>
                <Button
                  onClick={() => {
                    setSelectedOrderBumps({ nomeReal: false, fotosVideos: false, protecaoInvisivel: false })
                    processPixGeneration()
                  }}
                  variant="outline"
                  className="w-full py-2 text-xs border-border text-muted-foreground hover:text-foreground"
                >
                  Não, continuar apenas com relatório completo
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">⚡ Oferta válida apenas nesta tela!</p>
            </CardContent>
          </Card>
        </div>
      )}
      {showBonusPopup && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-card text-card-foreground border border-border animate-in fade-in-0 zoom-in-95">
            <CardContent className="p-6 space-y-4">
              {/* Barra de escassez no topo */}
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-4 w-4 text-blue-400 mr-2" />
                  <span className="text-blue-400 font-bold text-sm">
                    Oferta acaba em {formatBonusTime(bonusTimeLeft)} minutos
                  </span>
                </div>
                {/* Barra de progresso */}
                <div className="w-full bg-blue-900/30 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-blue-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(bonusTimeLeft / 300) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center">
                <div className="text-4xl mb-2">🎁</div>
                <h2 className="text-2xl font-bold text-blue-400 text-glow-blue mb-2">VOCÊ GANHOU BÔNUS ESPECIAL!</h2>
                <p className="text-lg font-semibold text-card-foreground mb-1">Pague AGORA e ganhe:</p>
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-400/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                  <p className="text-blue-400 font-bold text-lg">RELATÓRIO COMPLETO VIP + BÔNUS 🎁</p>
                  <p className="text-sm text-muted-foreground">
                    Análise completa de redes sociais + histórico de 3 meses
                  </p>
                  <div className="flex items-center justify-center mt-2 gap-3">
                    <span className="text-xl font-bold text-muted-foreground line-through">R$9,90</span>
                    <span className="text-2xl font-extrabold text-blue-400 bg-blue-400/20 px-3 py-1 rounded-full border border-blue-400/50 animate-pulse">
                      GRÁTIS
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-center p-3 bg-muted/10 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Seu código PIX:</p>
                  <div className="bg-background/30 p-2 rounded border text-xs break-all font-mono">{pixCode}</div>
                </div>

                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(pixCode!)
                    alert("Código PIX copiado! Cole no seu banco e finalize o pagamento para garantir o bônus!")
                  }}
                  className="w-full py-4 text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500/90 text-white animate-pulse"
                >
                  <Copy className="h-5 w-5 mr-2" />
                  COPIAR PIX E GARANTIR BÔNUS
                </Button>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    ⚡ Oferta válida apenas para pagamentos realizados até {(() => {
                      const now = new Date()
                      const futureTime = new Date(now.getTime() + 5 * 60 * 1000) // +5 minutos
                      return futureTime.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    })()}
                  </p>
                  <Button
                    onClick={() => setShowBonusPopup(false)}
                    variant="ghost"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Fechar (continuar sem bônus)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

/** Componente do carrossel de depoimentos */
function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    {
      name: "Mariana M.",
      text: "Já tinha usado a versão básica, mas o Premium é outro nível! Mostrou conversas arquivadas, mensagens deletadas e até histórico de chamadas perdidas. Descobri que ele apagava tudo antes de chegar em casa. O Premium salvou meu casamento... ou melhor, me salvou de um casamento falso.",
    },
    {
      name: "Larissa S.",
      text: "A diferença do Premium para a versão normal é absurda! Consegui ver até as conversas que ele pensava que tinha apagado para sempre. O relatório Premium mostrou 3 meses de histórico completo, incluindo fotos que ele enviou e recebeu. Valeu cada centavo a mais!",
    },
    {
      name: "Juliana R.",
      text: "Upgrade para o Premium foi a melhor decisão! A versão básica já tinha me ajudado, mas o Premium revelou detalhes que eu jamais imaginaria. Conversas em grupos secretos, mensagens programadas... ele era mais esperto do que eu pensava, mas o Premium foi mais esperto ainda.",
    },
    {
      name: "Camila T.",
      text: "Testei primeiro a versão gratuita, depois a básica, e finalmente o Premium. A diferença é gritante! O Premium conseguiu recuperar conversas de 6 meses atrás que ele tinha certeza que estavam apagadas. Descobri um padrão de comportamento que durava anos.",
    },
    {
      name: "Fernanda L.",
      text: "O Premium tem recursos que a versão normal não consegue alcançar. Análise de padrões de sono, horários de atividade, até localização aproximada baseada na atividade online. Descobri que as 'viagens de trabalho' dele eram bem diferentes do que ele contava.",
    },
    {
      name: "Beatriz C.",
      text: "Fiz upgrade para o Premium depois de usar a versão básica por uma semana. A diferença é como comparar um celular simples com um smartphone! O Premium mostrou conexões entre contatos, grupos em comum, até análise de sentimentos das mensagens.",
    },
    {
      name: "Amanda P.",
      text: "O relatório Premium é incrivelmente detalhado! Além de tudo que a versão normal mostra, ele faz análise comportamental, mostra padrões de mentiras e até sugere perguntas para confrontar com base nos dados. É como ter um detetive particular digital.",
    },
    {
      name: "Gabriela F.",
      text: "Upgrade do básico para o Premium foi o melhor investimento! Descobri que ele usava 8 apps diferentes de relacionamento, alguns que eu nem conhecia. O Premium rastreia atividade em todas as plataformas sociais, não só WhatsApp.",
    },
    {
      name: "Rafaela M.",
      text: "A versão Premium conseguiu recuperar até conversas que ele apagou há 4 meses! Mostrou também análise de frequência - quando ele mais mentia, com quem mais conversava, até os horários que ele ficava mais ativo online. Dados que a versão básica não consegue capturar.",
    },
    {
      name: "Patrícia D.",
      text: "O Premium tem inteligência artificial que analisa padrões de comportamento! Identificou automaticamente quando ele estava mentindo baseado no histórico de mensagens. A versão normal só mostra os dados, o Premium interpreta tudo para você.",
    },
    {
      name: "Carolina B.",
      text: "Impressionante como o Premium consegue cruzar dados de diferentes fontes! Mostrou que as 'amigas do trabalho' dele eram na verdade matches do Tinder. A análise cruzada de dados do Premium é algo que você não encontra em lugar nenhum.",
    },
    {
      name: "Vanessa K.",
      text: "O Premium tem recurso de 'linha do tempo' que mostra cronologicamente todas as traições! Consegui ver exatamente quando tudo começou, como evoluiu, e até prever os próximos passos dele. É como ter uma máquina do tempo digital.",
    },
    {
      name: "Priscila A.",
      text: "Usei o Premium para confirmar minha paranoia e descobri que estava errada - meu marido é fiel mesmo! Mas o relatório Premium me deu uma paz de espírito que a versão básica não conseguiria. A análise psicológica mostrou que ele realmente me ama.",
    },
    {
      name: "Renata F.",
      text: "O Premium faz análise de compatibilidade do relacionamento baseado nos dados coletados! Além de mostrar se há traição, ele avalia a saúde do relacionamento e dá sugestões de melhoria. É terapia de casal digital!",
    },
    {
      name: "Luciana M.",
      text: "A diferença do Premium é que ele não só coleta dados, mas também oferece soluções! Mostrou que meu marido é fiel, mas também identificou problemas de comunicação no nosso relacionamento e sugeriu como melhorar. Salvou meu casamento de verdade!",
    },
    {
      name: "Daniela S.",
      text: "O Premium tem suporte 24h com especialistas em relacionamento! Além do relatório completo, você pode tirar dúvidas e receber orientação profissional. É como ter um psicólogo e detetive trabalhando juntos no seu caso.",
    },
  ]

  // Auto-rotação do carrossel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 10000) // Alterado de 7000 para 10000 (10 segundos)

    return () => clearInterval(interval)
  }, [testimonials.length])

  // Mostrar 3 depoimentos por vez
  const getVisibleTestimonials = () => {
    const visible = []
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % testimonials.length
      visible.push(testimonials[index])
    }
    return visible
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {getVisibleTestimonials().map((testimonial, index) => (
          <TestimonialCard key={`${currentIndex}-${index}`} name={testimonial.name} text={testimonial.text} />
        ))}
      </div>

      {/* Indicadores do carrossel */}
      <div className="flex justify-center space-x-2">
        {Array.from({ length: Math.ceil(testimonials.length / 3) }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index * 3)}
            className={`w-2 h-2 rounded-full transition-colors ${
              Math.floor(currentIndex / 3) === index ? "bg-blue-400" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

/** Componente auxiliar das estatísticas */
function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-pink-500 text-3xl font-bold">{value}</span>
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
