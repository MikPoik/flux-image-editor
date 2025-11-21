import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { 
  Menu, 
  Home, 
  Wand2, 
  Images, 
  User, 
  LogOut,
  X,
  CreditCard
} from "lucide-react";

export function Navigation() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      show: true
    },
    {
      href: "/pricing",
      label: "Pricing",
      icon: CreditCard,
      show: !user
    },
    {
      href: "/image-editor",
      label: "Editor",
      icon: Wand2,
      show: !!user
    },
    {
      href: "/gallery",
      label: "Gallery", 
      icon: Images,
      show: !!user
    },
    {
      href: "/subscription",
      label: "Subscription",
      icon: CreditCard,
      show: !!user
    }
  ];

  const closeSheet = () => setOpen(false);

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <h1 className="text-xl md:text-2xl font-bold text-foreground cursor-pointer">
            Flux-a-Image
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          {navigationItems.map((item) => {
            if (!item.show) return null;
            return (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={location === item.href ? 'default' : 'ghost'} 
                  size="sm"
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          
          {user && (
            <>
              <div className="flex items-center space-x-2 ml-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground hidden lg:block">
                  {(user as any)?.displayName || (user as any)?.primaryEmail || 'User'}
                </span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/handler/sign-out'}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          )}
          
          {!user && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/handler/sign-in'}
              >
                Sign In
              </Button>
              <Button 
                variant="default"
                size="sm"
                onClick={() => window.location.href = '/handler/sign-up'}
              >
                Sign Up
              </Button>
            </div>
          )}
          
          <ThemeToggle />
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <h2 className="text-lg font-semibold">Menu</h2>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-6">
                  <div className="space-y-2">
                    {navigationItems.map((item) => {
                      if (!item.show) return null;
                      return (
                        <Link key={item.href} href={item.href}>
                          <Button 
                            variant={location === item.href ? 'default' : 'ghost'} 
                            className="w-full justify-start"
                            onClick={closeSheet}
                          >
                            <item.icon className="h-5 w-5 mr-3" />
                            {item.label}
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                </nav>

                {/* User Section */}
                <div className="border-t pt-4 mt-auto">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="" alt="User" />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {(user as any)?.displayName || (user as any)?.primaryEmail || 'User'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Signed in
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          closeSheet();
                          window.location.href = '/handler/sign-out';
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          closeSheet();
                          window.location.href = '/handler/sign-in';
                        }}
                      >
                        Sign In
                      </Button>
                      <Button 
                        variant="default"
                        className="w-full"
                        onClick={() => {
                          closeSheet();
                          window.location.href = '/handler/sign-up';
                        }}
                      >
                        Sign Up
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}