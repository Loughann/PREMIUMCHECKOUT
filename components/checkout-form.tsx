"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ShoppingCart, ArrowRight, Shield } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"

interface CheckoutFormProps {
  formData: {
    name: string
    email: string
    phone: string
    paymentMethod: string
  }
  setFormData: (data: any) => void
  onComplete: (totalValue: number, hasOrderBump: boolean) => void
}

export function CheckoutForm({ formData, setFormData, onComplete }: CheckoutFormProps) {
  const [timeLeft, setTimeLeft] = useState(5 * 60) // 5 minutos em segundos
  const [hasOrderBump, setHasOrderBump] = useState(false)

  const basePrice = 19.9
  const orderBumpPrice = 9.9
  const totalPrice = hasOrderBump ? basePrice + orderBumpPrice : basePrice

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleComplete = () => {
    onComplete(totalPrice, hasOrderBump)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-red-900 text-white">
        <CardContent className="p-4 flex items-center gap-3">
          <ShoppingCart className="w-6 h-6" />
          <div>
            <div className="font-medium">VOCÊ ESTÁ ADQUIRINDO:</div>
            <div className="text-lg font-bold">Whats Espião Premium</div>
          </div>
        </CardContent>
      </Card>

      {/* Scarcity Bar */}
      <div className="bg-red-600 text-white p-3 rounded-lg text-center font-bold animate-pulse">
        <div className="flex items-center justify-center gap-2">
          <span className="text-yellow-300">⚠️</span>
          <span>Esta oferta expira em {formatTime(timeLeft)}</span>
          <span className="text-yellow-300">⚠️</span>
        </div>
      </div>

      {/* Step 1 - Personal Data */}
      <Card>
        <CardHeader className="bg-gray-400 text-white p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-gray-400 rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <span className="text-xl font-extrabold">DADOS PESSOAIS</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Nome completo
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite seu nome completo"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Digite seu e-mail"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium">
              Telefone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Digite seu telefone"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 2 - Payment */}
      <Card>
        <CardHeader className="bg-gray-400 text-white p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-gray-400 rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <span className="text-xl font-extrabold">PAGAMENTO</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Button
                variant="outline"
                className={`h-12 px-6 bg-white border-2 border-green-300 text-green-700 hover:bg-green-50 relative ${
                  formData.paymentMethod === "pix" ? "border-green-500 bg-green-50" : ""
                }`}
                onClick={() => setFormData({ ...formData, paymentMethod: "pix" })}
              >
                <div className="flex items-center gap-3">
                  {/* Ícone PIX oficial */}
                  <img src="/images/pix-icon.png" alt="PIX" className="w-5 h-5" />
                  <span className="font-medium text-green-700">Pix</span>
                </div>
              </Button>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-2">
              <span className="text-teal-600 font-bold text-base">01.</span>
              <p>Pagamento em segundos, sem complicações</p>
            </div>

            <div className="flex gap-2">
              <span className="text-teal-600 font-bold text-base">02.</span>
              <p>Basta escanear, com o aplicativo do seu banco, o QRCode que iremos gerar sua compra</p>
            </div>

            <div className="flex gap-2">
              <span className="text-teal-600 font-bold text-base">03.</span>
              <p>O PIX foi desenvolvido pelo Banco Central para facilitar suas compras e é 100% seguro.</p>
            </div>
          </div>

          {/* Step 3 - Offer */}
          <Card>
            <CardHeader className="bg-gray-400 text-white p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white text-gray-400 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <span className="font-extrabold text-xl">COMPRE JUNTO</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Statistics */}
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs">
                  <span className="font-bold text-black">68% das pessoas</span>{" "}
                  <span className="text-black font-medium">que compraram</span>{" "}
                  <span className="font-bold text-black">Whats Espião Premium</span>{" "}
                  <span className="text-black font-medium">também se interessaram por:</span>
                </p>
              </div>

              {/* Main Offer - Novo estilo com fundo branco */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  {/* Green Lock Icon */}
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <Checkbox
                        id="addon"
                        className="mt-1 w-4 h-4 border-2 border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                        checked={hasOrderBump}
                        onCheckedChange={(checked) => setHasOrderBump(checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="text-blue-600 font-bold text-sm mb-2">VÁLIDO PARA PREMIUM</div>
                        <div className="text-green-600 font-bold text-base mb-3">À VISTA POR R$ 9,90</div>

                        {/* Features */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-red-600">🔓</span>
                            <span className="text-red-600 font-bold leading-tight">
                              📸 Fotos e Vídeos Secretos por 30 Dias
                            </span>
                          </div>

                          <div className="text-gray-600 text-sm mb-2 leading-relaxed">
                            Receba relatórios semanais e mensal com novos acessos e descobertas. Tudo isso sem levantar
                            suspeitas.
                          </div>

                          <div className="text-cyan-600 text-sm font-medium mb-3">
                            🔍 Ideal pra quem quer monitoramento constante.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full bg-green-500 hover:bg-green-600 text-white h-12 font-bold flex items-center justify-center gap-2"
            onClick={handleComplete}
          >
            Finalizar Compra <ArrowRight className="w-5 h-5" />
          </Button>

          {/* Security Info */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
              <Shield className="w-4 h-4" />
              <span>Pagamento 100% seguro, processado com criptografia 128bits.</span>
            </div>
            <p className="text-xs text-gray-500">Produto digital, os dados para acesso serão enviados por email.</p>
          </div>

          {/* Purchase Summary Section */}
          <Card className="mt-6">
            <CardHeader className="bg-gray-400 text-white p-3 text-center">
              <span className="text-xl font-extrabold">RESUMO DA COMPRA</span>
            </CardHeader>
            <CardContent className="p-6 text-center">
              {/* Product Icon - Real Spy Logo */}
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src="/images/espiao-logo.webp"
                  alt="Whats Espião Premium Logo"
                  className="w-full h-full object-cover"
                />
              </div>

              <h2 className="text-xl font-bold mb-2">Whats Espião Premium</h2>
              <p className="text-gray-600 text-sm mb-6">
                ÚLTIMAS UNIDADES - R$ {totalPrice.toFixed(2).replace(".", ",")}
              </p>

              <div className="bg-gray-50 rounded-lg overflow-hidden mb-4">
                <div className="bg-gray-200 p-3 flex justify-between font-medium">
                  <span>Total Hoje:</span>
                  <span className="text-green-600 font-bold">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex justify-between">
                    <span>Whats Espião Premium</span>
                    <span className="text-green-600 font-bold">R$ {basePrice.toFixed(2).replace(".", ",")}</span>
                  </div>

                  {hasOrderBump && (
                    <div className="flex justify-between">
                      <span>Fotos e Vídeos Secretos</span>
                      <span className="text-green-600 font-bold">R$ {orderBumpPrice.toFixed(2).replace(".", ",")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Support Email */}
              <div className="text-center text-sm text-gray-600 mb-4">
                <p>
                  <span className="font-medium">E-MAIL DE SUPORTE:</span> whatsdetect.app@gmail.com
                </p>
              </div>

              {/* Secure Purchase Button */}
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white h-12 font-bold mb-4">
                <span className="mr-2">💚</span>
                COMPRA 100% SEGURA
              </Button>

              {/* Terms and Conditions */}
              <div className="text-xs text-gray-500 text-center mt-4">
                <p>
                  Ao continuar nesta compra, você concorda com os{" "}
                  <span className="text-blue-600 underline cursor-pointer">Termos de Compra</span> e{" "}
                  <span className="text-blue-600 underline cursor-pointer">Termos de Privacidade</span> .
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
