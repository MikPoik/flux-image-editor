import type { RouteDefinition } from "@shared/route-metadata";

export const route: RouteDefinition = {
  path: "/privacy-policy",
  ssr: true,
  metadata: {
    title: "Privacy Policy - Flux-a-Image",
    description:
      "Learn how Flux-a-Image collects, uses, and safeguards your data when using our AI image editing tools.",
    canonical: "https://fluxaimage.com/privacy-policy",
    ogTitle: "Privacy Policy | Flux-a-Image",
    ogDescription:
      "Understand our commitment to protecting your privacy and managing your data responsibly.",
  },
};

const PolicySection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6">
    <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
    <div className="text-slate-400">{children}</div>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">Privacy Policy</h1>
          <p className="text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <PolicySection title="1. Information We Collect">
          <div className="space-y-3">
            <p>We collect information you provide directly to us, such as:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account information (email address, username, profile information)</li>
              <li>Images you upload or generate through our service</li>
              <li>Text prompts and editing instructions you provide</li>
              <li>Payment information for subscription services</li>
              <li>Communications with our support team</li>
            </ul>
          </div>
        </PolicySection>

        <PolicySection title="2. How We Use Your Information">
          <div className="space-y-3">
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve our AI image editing services</li>
              <li>Process your image editing and generation requests</li>
              <li>Manage your account and subscription</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve our AI models</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </div>
        </PolicySection>

        <PolicySection title="3. Information Sharing">
          <div className="space-y-3">
            <p>We do not sell, trade, or otherwise transfer your personal information to third parties, except:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>With your explicit consent</li>
              <li>To service providers who assist in operating our platform</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p className="mt-3">We may share anonymized, aggregated data that cannot be used to identify you.</p>
          </div>
        </PolicySection>

        <PolicySection title="4. Data Storage and Security">
          <div className="space-y-3">
            <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your data is stored on secure servers with encryption both in transit and at rest.</p>
            <p>However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.</p>
          </div>
        </PolicySection>
      </div>
    </div>
  );
}
