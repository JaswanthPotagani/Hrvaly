import Link from 'next/link'
import Image from 'next/image'
import { Button } from './ui/button'
import { LayoutDashboard, UserIcon } from 'lucide-react'
import { checkUser } from '../lib/checkUser'
import { CareerMenu } from './career-menu'
import { MobileMenu } from './mobile-menu'
import { MarketPulseButton } from './market-pulse-button'
import { UserMenu } from './user-menu'

const Header = async () => {
  const user = await checkUser(true);

  return (
    <header className='fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-[backdrop-filter]:bg-background/60'>
      <nav className='container mx-auto px-4 h-16 flex items-center justify-between'>
        <Link href='/'>
          <Image 
            src='/logo.png' 
            alt='mArgI Logo' 
            width={200} 
            height={60} 
            priority
            sizes="(max-width: 768px) 160px, 200px"
            quality={75}
            className='h-10 py-1 w-auto object-contain md:h-12'
          />
        </Link>
        
        {/* Actions Area */}
        <div className='flex items-center space-x-2 md:space-x-4'>
          {user ? (
            <>
              {/* Desktop Navigation */}
              <div className='hidden md:flex items-center space-x-2'>
                <Link href='/dashboard'>
                  <MarketPulseButton />
                </Link>
                
                <CareerMenu />
              </div>
  
              {/* Mobile Navigation */}
              <div className='md:hidden'>
                <MobileMenu />
              </div>

               <UserMenu user={user} />
            </>
          ) : (
             <Link href="/sign-in">
              <Button variant="outline">
                <UserIcon className='h-4 w-4 mr-2'/>
                <span>Sign In</span>
              </Button>
             </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Header
