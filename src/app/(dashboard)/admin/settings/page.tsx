import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Settings, Bell, Shield, Palette, Globe, Database, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const settingsSections = [
    {
      title: "Notificaciones",
      description: "Configura las notificaciones del sistema",
      icon: Bell,
      settings: [
        {
          id: "email-notifications",
          label: "Notificaciones por email",
          description: "Enviar notificaciones importantes por correo electrónico",
          defaultChecked: true,
        },
        {
          id: "change-alerts",
          label: "Alertas de cambios",
          description: "Notificar cuando hay nuevas solicitudes de cambio de turno",
          defaultChecked: true,
        },
        {
          id: "schedule-reminders",
          label: "Recordatorios de horario",
          description: "Enviar recordatorios antes de cada turno",
          defaultChecked: false,
        },
      ],
    },
    {
      title: "Seguridad",
      description: "Opciones de seguridad y acceso",
      icon: Shield,
      settings: [
        {
          id: "two-factor",
          label: "Autenticación de dos factores",
          description: "Requerir verificación adicional al iniciar sesión",
          defaultChecked: false,
        },
        {
          id: "session-timeout",
          label: "Cierre automático de sesión",
          description: "Cerrar sesión después de 30 minutos de inactividad",
          defaultChecked: true,
        },
      ],
    },
    {
      title: "Sistema",
      description: "Configuración general del sistema",
      icon: Database,
      settings: [
        {
          id: "auto-approve",
          label: "Aprobación automática",
          description: "Aprobar cambios de turno automáticamente cuando ambas partes aceptan",
          defaultChecked: true,
        },
        {
          id: "preference-lock",
          label: "Bloqueo de preferencias",
          description: "Bloquear preferencias 3 días antes de generar horarios",
          defaultChecked: true,
        },
      ],
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/25">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">
            Administra la configuración del sistema
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingsSections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border bg-card shadow-sm overflow-hidden"
          >
            <div className="border-b bg-muted/30 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">{section.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y">
              {section.settings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between p-6"
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={setting.id} className="font-medium">
                      {setting.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {setting.description}
                    </p>
                  </div>
                  <Switch
                    id={setting.id}
                    defaultChecked={setting.defaultChecked}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="rounded-xl bg-blue-100 dark:bg-blue-900/50 p-3 w-fit">
            <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="mt-4 font-semibold">Idioma</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Español (ES)
          </p>
          <Button variant="outline" size="sm" className="mt-4 rounded-xl">
            Cambiar idioma
          </Button>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="rounded-xl bg-violet-100 dark:bg-violet-900/50 p-3 w-fit">
            <Palette className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="mt-4 font-semibold">Tema</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Modo claro
          </p>
          <Button variant="outline" size="sm" className="mt-4 rounded-xl">
            Cambiar tema
          </Button>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/50 p-3 w-fit">
            <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="mt-4 font-semibold">Email del sistema</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            noreply@shiftbalance.com
          </p>
          <Button variant="outline" size="sm" className="mt-4 rounded-xl">
            Configurar SMTP
          </Button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="rounded-xl bg-gradient-to-r from-primary to-emerald-600 px-8 shadow-lg shadow-primary/25">
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
