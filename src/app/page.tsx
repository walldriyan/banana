import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-headline">Tailwind Starter</CardTitle>
              <CardDescription>
                A modern and expressive starting point.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold font-headline tracking-tight text-primary">
              Hello, World!
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Welcome to your new Next.js application.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline">Learn More</Button>
          <Button>
            Get Started
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
