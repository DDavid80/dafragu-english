import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata:Metadata={title:'DaFragu English · English for everyday life',description:'Inglese per la vita quotidiana, il lavoro, gli interessi e i viaggi.',icons:{icon:'/favicon.svg',apple:'/apple-icon.png'},appleWebApp:{capable:true,title:'DaFragu English',statusBarStyle:'black-translucent'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#101c2b'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="it"><body>{children}</body></html>}
