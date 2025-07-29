import jwt from 'jsonwebtoken'

const createJWT = (payload: object) => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "1d"
  })
}

export { createJWT }