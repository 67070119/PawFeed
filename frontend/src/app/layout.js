import './globals.css';
import './theme.css';
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from '../lib/auth-context';
import NavBar from '../components/NavBar';

export const metadata = {
  title: 'PawFeed',
  description: 'แผนที่แบ่งปันตำแหน่งและติดตามการให้อาหารสัตว์จรจัด',
};

export const viewport = {
  themeColor: '#17191b',
  colorScheme: 'light',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
