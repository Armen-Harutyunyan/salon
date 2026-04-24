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
        <main>{children}</main>
      </body>
    </html>
  )
}
