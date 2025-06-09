
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI Image Editor. All rights reserved.
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <Link href="/terms-of-service">
              <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                Terms of Service
              </span>
            </Link>
            <Link href="/privacy-policy">
              <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                Privacy Policy
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
