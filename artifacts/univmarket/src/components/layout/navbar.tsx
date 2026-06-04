import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Bell, Search, ShoppingBag, ChevronDown, LogOut, User,
  BarChart2, Wallet, Settings, Shield, Package, Heart, Menu, X, Moon, Sun,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useListNotifications } from "@workspace/api-client-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

interface NavbarProps {
  darkMode: boolean;
  toggleDark: () => void;
}

export default function Navbar({ darkMode, toggleDark }: NavbarProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated, isSeller, isAdmin, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const { data: notifs } = useListNotifications(
    { unread_only: true, limit: 5 },
    { query: { enabled: isAuthenticated } }
  );
  const unreadCount = notifs?.unread_count ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) setLocation(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-8 h-8 rounded-lg gradient-teal flex items-center justify-center text-white font-bold text-sm">UM</div>
          <span className="font-bold text-lg text-foreground hidden sm:block">UnivMarket</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("search_placeholder")}
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="pl-9 pr-4 h-9 bg-muted/50 border-border/50 focus:bg-background"
            />
          </div>
        </form>

        <nav className="hidden md:flex items-center gap-1 ml-auto">
          <Link href="/search-sellers">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Vendeurs</Button>
        </Link>
        <Link href="/leaderboard">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Classement</Button>
          </Link>
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={toggleDark} className="text-muted-foreground">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isAuthenticated ? (
            <>
              <Link href="/wishlist">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Heart className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">{unreadCount > 9 ? "9+" : unreadCount}</Badge>
                  )}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.avatar ?? undefined} />
                      <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm max-w-24 truncate">{user?.name}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <ShoppingBag className="h-4 w-4" /> Tableau de bord
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user?.id}`} className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" /> Mon profil
                    </Link>
                  </DropdownMenuItem>
                  {isSeller && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/seller/services" className="flex items-center gap-2 cursor-pointer">
                          <Package className="h-4 w-4" /> Mes services
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/seller/analytics" className="flex items-center gap-2 cursor-pointer">
                          <BarChart2 className="h-4 w-4" /> Analytiques
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/seller/wallet" className="flex items-center gap-2 cursor-pointer">
                          <Wallet className="h-4 w-4" /> Portefeuille
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Shield className="h-4 w-4" /> Administration
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive flex items-center gap-2 cursor-pointer">
                    <LogOut className="h-4 w-4" /> {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" size="sm">{t("login")}</Button></Link>
              <Link href="/register"><Button size="sm" className="gradient-teal text-white border-none">{t("register")}</Button></Link>
            </div>
          )}
        </nav>

        <Button variant="ghost" size="icon" className="md:hidden ml-auto" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-4 py-3 space-y-2 animate-fade-in">
          <div className="pb-2">
            <LanguageSwitcher />
          </div>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">Tableau de bord</Button></Link>
              <Link href="/seller/services" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">Mes services</Button></Link>
              <Link href="/notifications" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">Notifications {unreadCount > 0 && `(${unreadCount})`}</Button></Link>
              <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>{t("logout")}</Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{t("login")}</Button></Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}><Button className="w-full gradient-teal text-white border-none">{t("register")}</Button></Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}