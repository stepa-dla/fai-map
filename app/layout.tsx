import type {Metadata} from 'next';
import './globals.css';
export const metadata: Metadata={title:'FAI · Mapa učeben',icons:{icon:(process.env.NEXT_PUBLIC_BASE_PATH||'')+'/favicon.svg'},description:'Interaktivní mapa budovy U5 Fakulty aplikované informatiky UTB. Najděte učebnu a cestu mezi podlažími.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="cs"><body>{children}</body></html>}
