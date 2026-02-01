import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  Image, 
  Mic, 
  Zap, 
  Shield, 
  Globe,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="container px-4 py-24 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>Powered by OpenAI's Latest Models</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Interact with AI through
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {' '}Text, Images & Voice
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl">
            Experience the future of AI interactions. Chat with AI in real-time, 
            analyze images, generate content, and use voice commands—all in one platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Try Demo
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground">
            No credit card required • Free tier available
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container px-4 py-24 bg-muted/50">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Powerful Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to interact with AI in multiple ways
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Real-time Text Chat</CardTitle>
              <CardDescription>
                Chat with AI using the latest GPT models with streaming responses for instant feedback
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Image className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Image Analysis & Generation</CardTitle>
              <CardDescription>
                Upload images for analysis or generate stunning images from text descriptions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Voice Interactions</CardTitle>
              <CardDescription>
                Convert text to speech or transcribe audio to text with high accuracy
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Optimized for speed with real-time streaming and low latency responses
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your data is encrypted and secure. We never store your conversations without permission
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Multi-Modal Support</CardTitle>
              <CardDescription>
                Seamlessly switch between text, images, and voice in a single conversation
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="container px-4 py-24 bg-muted/50">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">About MultimodAI</h2>
          <p className="text-lg text-muted-foreground">
            We're building the future of human-AI interaction. Our platform leverages 
            OpenAI's cutting-edge models to provide seamless, multi-modal AI experiences 
            that feel natural and intuitive.
          </p>
          <p className="text-lg text-muted-foreground">
            Whether you're a developer, content creator, or business professional, 
            MultimodAI gives you the tools to interact with AI in ways that were 
            previously impossible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">Start Building</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">View Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-24">
        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to get started?
            </h2>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Join thousands of users who are already using MultimodAI 
              to transform their workflows.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
