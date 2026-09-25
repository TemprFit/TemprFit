import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import BMILog from '@/models/BMILog'
import { verifyToken } from '@/lib/auth'

export async function DELETE(req, { params }) {
  try {
    await connectDB()
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { id } = params
    
    const deletedLog = await BMILog.findOneAndDelete({ _id: id, user: decoded.id })
    
    if (!deletedLog) {
      return NextResponse.json({ error: 'Log not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: deletedLog }, { status: 200 })
  } catch (error) {
    console.error('BMI Delete Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
