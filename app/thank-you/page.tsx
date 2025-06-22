"use client"

import { useEffect, useState } from "react"
import { MatrixBackground } from "@/components/matrix-background"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Mail } from "lucide-react"

export default function ThankYouPage() {
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Redireciona para o Google após 5 segundos
          window.location.href = "https://google.com"
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <MatrixBackground />

      <Card className="w-full max-w-md shadow-lg rounded-lg bg-card text-card-foreground relative z-10">
        <CardContent className="p-8 space-y-6">
          {/* HEADER DE SUCESSO */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-[#00BFFF] animate-pulse" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#00BFFF] text-glow-blue">COMPRA CONFIRMADA!</h1>
            <p className="text-lg font-semibold text-foreground">Pagamento aprovado com sucesso.</p>
          </div>

          {/* INFORMAÇÕES */}
          <div className="bg-muted/20 rounded-lg p-6 border border-border text-center space-y-4">
            <div className="flex justify-center">
              <Mail className="h-12 w-12 text-[#00BFFF]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">ESPIÃO PREMIUM</h2>
              <p className="text-foreground">
                Seu acesso premium e todos os relatórios serão enviados para seu e-mail em alguns minutos.
              </p>
            </div>
          </div>

          {/* REDIRECIONAMENTO */}
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">Redirecionando em:</p>
            <div className="text-4xl font-bold text-[#00BFFF]">{countdown}s</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
