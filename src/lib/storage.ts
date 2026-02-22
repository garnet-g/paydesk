
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key for administrative tasks like creating buckets
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function uploadLogo(schoolId: string, base64Data: string): Promise<string> {
    // 1. Ensure bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketName = 'logos'

    if (!buckets?.find(b => b.name === bucketName)) {
        await supabaseAdmin.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
            fileSizeLimit: 2 * 1024 * 1024 // 2MB
        })
    }

    // 2. Prepare file
    const byteString = atob(base64Data.split(',')[1])
    const mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
    }
    const blob = new Blob([ab], { type: mimeString })

    // 3. Upload
    const fileName = `${schoolId}-${Date.now()}.png`
    const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(fileName, blob, {
            contentType: mimeString,
            upsert: true
        })

    if (error) {
        console.error('Supabase Upload Error:', error)
        throw new Error('Failed to upload logo to storage')
    }

    // 4. Get Public URL
    const { data: urlData } = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(data.path)

    return urlData.publicUrl
}
