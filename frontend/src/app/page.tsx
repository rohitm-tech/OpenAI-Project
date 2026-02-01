'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Image, 
  Mic, 
  Zap, 
  Shield, 
  Globe,
  Sparkles,
  ArrowRight,
  LayoutDashboard
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="container px-4 py-24 md:py-32">
        <motion.div
          className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
            <span>Powered by OpenAI's Latest Models</span>
          </motion.div>
          
          <motion.h1
            className="text-4xl md:text-6xl font-bold tracking-tight"
            variants={itemVariants}
          >
            Interact with AI through{' '}
            <motion.span
              className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent inline-block"
              animate={{
                backgroundPosition: ['0%', '100%', '0%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                backgroundSize: '200% auto',
              }}
            >
              Text, Images & Voice
            </motion.span>
          </motion.h1>
          
          <motion.p
            className="text-xl text-muted-foreground max-w-2xl"
            variants={itemVariants}
          >
            Experience the future of AI interactions. Chat with AI in real-time, 
            analyze images, generate content, and use voice commands—all in one platform.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            variants={itemVariants}
          >
            {isAuthenticated ? (
              <Link href="/dashboard">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="text-lg px-8">
                    Go to Dashboard
                    <LayoutDashboard className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="lg" className="text-lg px-8">
                      Get Started Free
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="inline-block"
                      >
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </motion.span>
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/dashboard">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="lg" variant="outline" className="text-lg px-8">
                      Try Demo
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}
          </motion.div>
          
          <motion.p
            className="text-sm text-muted-foreground"
            variants={itemVariants}
          >
            No credit card required • Free tier available
          </motion.p>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="container px-4 py-24 bg-muted/50">
        <motion.div
          className="text-center space-y-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold">Powerful Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to interact with AI in multiple ways
          </p>
        </motion.div>

        <motion.div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={cardVariants}>
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105">
              <CardHeader>
                <motion.div
                  className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <MessageSquare className="h-6 w-6 text-primary" />
                </motion.div>
                <CardTitle>Real-time Text Chat</CardTitle>
                <CardDescription>
                  Chat with AI using the latest GPT models with streaming responses for instant feedback
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105">
              <CardHeader>
                <motion.div
                  className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Image className="h-6 w-6 text-primary" />
                </motion.div>
                <CardTitle>Image Analysis & Generation</CardTitle>
                <CardDescription>
                  Upload images for analysis or generate stunning images from text descriptions
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105">
              <CardHeader>
                <motion.div
                  className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Mic className="h-6 w-6 text-primary" />
                </motion.div>
                <CardTitle>Voice Interactions</CardTitle>
                <CardDescription>
                  Convert text to speech or transcribe audio to text with high accuracy
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105">
              <CardHeader>
                <motion.div
                  className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Zap className="h-6 w-6 text-primary" />
                </motion.div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Optimized for speed with real-time streaming and low latency responses
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105">
              <CardHeader>
                <motion.div
                  className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Shield className="h-6 w-6 text-primary" />
                </motion.div>
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your data is encrypted and secure. We never store your conversations without permission
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105">
              <CardHeader>
                <motion.div
                  className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Globe className="h-6 w-6 text-primary" />
                </motion.div>
                <CardTitle>Multi-Modal Support</CardTitle>
                <CardDescription>
                  Seamlessly switch between text, images, and voice in a single conversation
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="container px-4 py-24 bg-muted/50">
        <motion.div
          className="max-w-3xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            About MultimodAI
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            We're building the future of human-AI interaction. Our platform leverages 
            OpenAI's cutting-edge models to provide seamless, multi-modal AI experiences 
            that feel natural and intuitive.
          </motion.p>
          <motion.p
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Whether you're a developer, content creator, or business professional, 
            MultimodAI gives you the tools to interact with AI in ways that were 
            previously impossible.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {isAuthenticated ? (
              <Link href="/dashboard">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Go to Dashboard
                  </Button>
                </motion.div>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="lg">Start Building</Button>
                  </motion.div>
                </Link>
                <Link href="/dashboard">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="lg" variant="outline">View Demo</Button>
                  </motion.div>
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-primary text-primary-foreground border-0 overflow-hidden relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/50 via-transparent to-primary/50"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
                ease: 'linear',
              }}
            />
            <CardContent className="p-12 text-center space-y-6 relative z-10">
              <motion.h2
                className="text-3xl md:text-4xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Ready to get started?
              </motion.h2>
              <motion.p
                className="text-xl text-primary-foreground/90 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Join thousands of users who are already using MultimodAI 
                to transform their workflows.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button size="lg" variant="secondary" className="text-lg px-8">
                        Go to Dashboard
                        <LayoutDashboard className="ml-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                ) : (
                  <Link href="/signup">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button size="lg" variant="secondary" className="text-lg px-8">
                        Get Started Free
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="inline-block"
                        >
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </motion.span>
                      </Button>
                    </motion.div>
                  </Link>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
