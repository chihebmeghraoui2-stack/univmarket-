interface QRCodeDisplayProps {
  url: string;
  size?: number;
  label?: string;
  showDownload?: boolean;
}

export default function QRCodeDisplay({ url, size = 240, label, showDownload = false }: QRCodeDisplayProps) {
  const encodedUrl = encodeURIComponent(url);
  const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`;

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 p-6 text-center">
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
      <img src={imageUrl} alt="QR code" width={size} height={size} className="mx-auto" />
      {showDownload ? (
        <a className="text-sm text-primary underline" href={imageUrl} download="univmarket-qr.png">
          Télécharger le QR
        </a>
      ) : null}
    </div>
  );
}
