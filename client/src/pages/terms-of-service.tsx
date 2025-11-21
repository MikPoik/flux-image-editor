import type { RouteDefinition } from "@shared/route-metadata";

export const route: RouteDefinition = {
  path: "/terms-of-service",
  ssr: true,
  metadata: {
    title: "Terms of Service - Flux-a-Image",
    description:
      "Review the terms and conditions for using Flux-a-Image's AI-powered image editing platform.",
    canonical: "https://fluxaimage.com/terms-of-service",
    ogTitle: "Terms of Service | Flux-a-Image",
    ogDescription:
      "Understand the guidelines and responsibilities when using our AI image editing services.",
  },
};

const TermsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-300 dark:border-slate-700/50 rounded-2xl p-6">
    <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
    <div className="text-slate-400">{children}</div>
  </div>
);

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-200 dark:to-purple-200">Terms of Service</h1>
          <p className="text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <TermsSection title="1. Acceptance of Terms">
          <p>By accessing and using AI Image Editor, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
        </TermsSection>

        <TermsSection title="2. Service Description">
          <p>AI Image Editor is a web-based platform that allows users to generate, edit, and manipulate images using artificial intelligence. Our service provides tools for image creation, modification, and enhancement through AI-powered algorithms.</p>
        </TermsSection>

        <TermsSection title="3. User Accounts">
          <div className="space-y-3">
            <p>To access certain features of our service, you may be required to create an account. You agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your password and account</li>
              <li>Promptly update account information to keep it accurate and complete</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </div>
        </TermsSection>

        <TermsSection title="4. Acceptable Use">
          <div className="space-y-3">
            <p>You agree not to use the service to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Generate, edit, or create illegal, harmful, or offensive content</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others, including intellectual property rights</li>
              <li>Upload or generate content that violates our community guidelines</li>
              <li>Attempt to reverse engineer or exploit our AI models</li>
              <li>Use the service for commercial purposes without authorization</li>
            </ul>
          </div>
        </TermsSection>

        <TermsSection title="5. Content and Intellectual Property">
          <div className="space-y-3">
            <p>You retain ownership of the content you upload to our service. However, by using our service, you grant us a non-exclusive, worldwide, royalty-free license to use, modify, and display your content for the purpose of providing our services.</p>
            <p>Generated images and content created through our AI tools are owned by you, subject to our acceptable use policies and any applicable third-party rights.</p>
          </div>
        </TermsSection>

        <TermsSection title="6. Privacy and Data Protection">
          <p>Your privacy is important to us. We collect and use your personal information in accordance with our Privacy Policy. By using our service, you consent to the collection and use of your information as described in our Privacy Policy.</p>
        </TermsSection>
      </div>
    </div>
  );
}
