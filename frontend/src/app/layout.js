import './globals.css';
import 'leaflet/dist/leaflet.css';
import './theme.css';
import { AuthProvider } from '../lib/auth-context';
import NavBar from '../components/NavBar';

export const metadata = {
  title: 'PawFeed',
  description: 'แผนที่แบ่งปันตำแหน่งและติดตามการให้อาหารสัตว์จรจัด',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#171a1d',
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          <a className="skipLink" href="#main-content">ข้ามไปยังเนื้อหาหลัก</a>
          <NavBar />
          <div id="main-content" tabIndex="-1">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
