import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function App() {
  return (
    <main className="flex min-h-svh items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>HA Theme Builder</CardTitle>
          <CardDescription>
            Scaffold is up. Product features land in later milestones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>It works</Button>
        </CardContent>
      </Card>
    </main>
  )
}

export default App
