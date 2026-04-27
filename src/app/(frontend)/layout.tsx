import Script from 'next/script'
import type React from 'react'
import './styles.css'

export const metadata = {
  description: 'Telegram mini app for salon booking with Payload admin panel.',
  title: 'Salon Booking Mini App',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="ru">
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <main>{children}</main>
      </body>
    </html>
  )
}
