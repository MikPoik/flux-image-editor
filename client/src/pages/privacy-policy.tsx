import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>We collect information you provide directly to us, such as:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Account information (email address, username, profile
                  information)
                </li>
                <li>Images you upload or generate through our service</li>
                <li>Text prompts and editing instructions you provide</li>
                <li>Payment information for subscription services</li>
                <li>Communications with our support team</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Provide, maintain, and improve our AI image editing services
                </li>
                <li>Process your image editing and generation requests</li>
                <li>Manage your account and subscription</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns to improve our AI models</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Information Sharing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                We do not sell, trade, or otherwise transfer your personal
                information to third parties, except:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>With your explicit consent</li>
                <li>
                  To service providers who assist in operating our platform
                </li>
                <li>When required by law or to protect our rights</li>
                <li>
                  In connection with a merger, acquisition, or sale of assets
                </li>
              </ul>
              <p className="mt-3">
                We may share anonymized, aggregated data that cannot be used to
                identify you.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Data Storage and Security</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                We implement appropriate security measures to protect your
                personal information against unauthorized access, alteration,
                disclosure, or destruction. Your data is stored on secure
                servers with encryption both in transit and at rest.
              </p>
              <p>
                However, no method of transmission over the internet or
                electronic storage is 100% secure. While we strive to protect
                your personal information, we cannot guarantee absolute
                security.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Image and Content Handling</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Images you upload or generate are stored securely and are only
                accessible to you through your account. We do not use your
                images for training our AI models without your explicit consent.
              </p>
              <p>
                We may temporarily process your images and prompts to provide
                our editing services. This processing is necessary for the
                functionality of our service and is done in accordance with this
                privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                We use cookies and similar tracking technologies to enhance your
                experience on our platform. These may include:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Essential cookies for authentication and security</li>
                <li>Performance cookies to analyze usage patterns</li>
                <li>Functionality cookies to remember your preferences</li>
              </ul>
              <p className="mt-3">
                You can control cookie settings through your browser
                preferences.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>Our service integrates with third-party providers for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Payment processing (Stripe)</li>
                <li>Authentication services</li>
                <li>AI model hosting and processing</li>
                <li>Analytics and performance monitoring</li>
              </ul>
              <p className="mt-3">
                These third parties have their own privacy policies and terms of
                service.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Your Rights and Choices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access, update, or delete your personal information</li>
                <li>Download your data in a portable format</li>
                <li>Opt out of certain communications</li>
                <li>Delete your account and associated data</li>
                <li>Request correction of inaccurate information</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us through our support
                channels.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Data Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We retain your personal information for as long as necessary to
              provide our services, comply with legal obligations, resolve
              disputes, and enforce our agreements. When you delete your
              account, we will delete your personal information, though some
              information may be retained for legal or administrative purposes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries
              other than your own. We ensure appropriate safeguards are in place
              to protect your information in accordance with applicable data
              protection laws.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Our service is not intended for children under 13 years of age. We
              do not knowingly collect personal information from children under
              13. If you believe we have collected information from a child
              under 13, please contact us immediately.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>12. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We may update this privacy policy from time to time. We will
              notify you of any material changes by posting the new policy on
              this page and updating the "last updated" date. Your continued use
              of our service constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>13. Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or our data
              practices, please contact us through our support channels
              available on our website or by email at support@fluxaimage.com.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
