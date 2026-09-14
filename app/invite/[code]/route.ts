import { NextResponse } from 'next/server'

const GITHUB_REPOSITORY = 'https://github.com/kushagrasinghx/BitChord/'
const JAM_CODE = /^[A-Za-z0-9]{6}$/

type InviteRouteContext = {
  params: Promise<{ code: string }>
}

/**
 * Android opens a verified invite in BitChord before making a web request.
 * Reaching this handler therefore means the app is unavailable (or app links
 * were disabled), so send the listener to the install/download destination.
 */
export async function GET(_request: Request, context: InviteRouteContext) {
  const { code } = await context.params

  if (!JAM_CODE.test(code)) {
    return new NextResponse('Invalid BitChord invite.', { status: 404 })
  }

  const response = NextResponse.redirect(GITHUB_REPOSITORY, 307)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export const HEAD = GET
