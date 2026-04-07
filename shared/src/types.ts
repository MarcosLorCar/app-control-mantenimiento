export interface JwtPayload {
  sub: number
  email: string
  role: string
  can_write: boolean
  can_manage: boolean
  iat?: number
  exp?: number
}

export interface ApiSuccess<T> {
  data: T
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
