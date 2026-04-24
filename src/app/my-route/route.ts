import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const GET = async (_request: Request) => {
  const payload = await getPayload({
    config: configPromise,
  })

  return Response.json({
    adminRoute: payload.config.routes.admin,
    message: 'Salon mini app API is online.',
  })
}
