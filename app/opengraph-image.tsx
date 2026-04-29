import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Wyn — Personal English vocabulary learning';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: '#DC143C',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 140,
          fontWeight: 800,
          color: 'white',
          letterSpacing: '-6px',
          lineHeight: 1,
        }}
      >
        Wyn
      </div>
      <div
        style={{
          fontSize: 34,
          color: 'rgba(255, 255, 255, 0.75)',
          marginTop: 28,
          letterSpacing: '0.02em',
        }}
      >
        Personal English vocabulary learning
      </div>
    </div>,
    { ...size }
  );
}
