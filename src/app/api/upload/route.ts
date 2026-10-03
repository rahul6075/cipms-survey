import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary"

// Matches the client-side limits in SurveyPreviewRenderer.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_PDF_BYTES = 20 * 1024 * 1024

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 })
  // Public survey respondents upload here without a session, so cap what they can send.
  const isPdf = file.type === "application/pdf"
  if (!isPdf && !file.type.startsWith("image/"))
    return NextResponse.json({ error: "Only images and PDFs can be uploaded" }, { status: 415 })
  if (file.size > (isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES))
    return NextResponse.json({ error: `File is larger than ${isPdf ? 20 : 10} MB` }, { status: 413 })

  const buffer = Buffer.from(await file.arrayBuffer())

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "cipms", resource_type: "auto" },
      (err, res) => (err || !res ? reject(err) : resolve(res))
    ).end(buffer)
  })

  return NextResponse.json({ url: result.secure_url, public_id: result.public_id })
}
