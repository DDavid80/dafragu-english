import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata:Metadata={title:'DaFragu English · Take your words with you',description:'L’inglese da portare in viaggio. Il percorso di Davide e Francesca.',icons:{icon:'/favicon.svg',apple:'/apple-icon.png'},appleWebApp:{capable:true,title:'DaFragu English',statusBarStyle:'black'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#101c2b'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="it"><body>{children}</body></html>}
