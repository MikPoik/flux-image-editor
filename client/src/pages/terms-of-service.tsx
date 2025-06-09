
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              By accessing and using AI Image Editor, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Service Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              AI Image Editor is a web-based platform that allows users to generate, edit, and manipulate images using artificial intelligence. 
              Our service provides tools for image creation, modification, and enhancement through AI-powered algorithms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. User Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                To access certain features of our service, you may be required to create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your password and account</li>
                <li>Promptly update account information to keep it accurate and complete</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Acceptable Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Content and Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                You retain ownership of the content you upload to our service. However, by using our service, you grant us a 
                non-exclusive, worldwide, royalty-free license to use, modify, and display your content for the purpose of 
                providing our services.
              </p>
              <p>
                Generated images and content created through our AI tools are owned by you, subject to our acceptable use policies 
                and any applicable third-party rights.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Privacy and Data Protection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your privacy is important to us. We collect and use your personal information in accordance with our Privacy Policy. 
              By using our service, you consent to the collection and use of your information as described in our Privacy Policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Subscription and Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Some features of our service may require a paid subscription. By subscribing, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Pay all fees associated with your subscription</li>
                <li>Provide accurate billing information</li>
                <li>Notify us of any changes to your payment information</li>
                <li>Our refund policy as stated in your subscription agreement</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, AI Image Editor shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly 
              or indirectly, or any loss of data, use, goodwill, or other intangible losses.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Service Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We strive to maintain high availability of our service, but we do not guarantee uninterrupted access. 
              We reserve the right to modify, suspend, or discontinue the service at any time without notice.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Termination</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We may terminate or suspend your account and access to the service immediately, without prior notice or liability, 
              for any reason whatsoever, including violation of these Terms of Service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. We will notify users of any material changes to these terms. 
              Your continued use of the service after such modifications constitutes acceptance of the updated terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>12. Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us through our support channels 
              available on our website.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
