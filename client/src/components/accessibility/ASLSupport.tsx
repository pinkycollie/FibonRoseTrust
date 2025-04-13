import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ASLSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);

  // Stop pulsing when dialog is opened
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setIsPulsing(false);
    } else {
      // Resume pulsing after 30 seconds when closed
      setTimeout(() => setIsPulsing(true), 30000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className={`fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 p-0 flex items-center justify-center ${
            isPulsing ? 'animate-pulse shadow-lg shadow-primary/40' : ''
          } bg-gradient-to-r from-primary-600 to-primary-500`}
          size="icon"
          onClick={() => setIsOpen(true)}
        >
          <span className="material-icons text-2xl text-white">sign_language</span>
          <span className="sr-only">ASL Support</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="material-icons mr-2 text-primary">sign_language</span>
            ASL Video Support
          </DialogTitle>
          <DialogDescription>
            Connect with an ASL interpreter for real-time support
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-4 text-center">
            <div className="mx-auto mb-3 bg-primary-100 dark:bg-primary-900 rounded-full w-16 h-16 flex items-center justify-center">
              <span className="material-icons text-3xl text-primary">videocam</span>
            </div>
            <p className="text-sm">
              Click the button below to start a live ASL video call with our support team.
            </p>
            <div className="mt-4 flex justify-center">
              <Button className="bg-gradient-to-r from-green-600 to-green-500">
                <span className="material-icons text-sm mr-2">video_call</span>
                Start ASL Video Call
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="flex flex-col h-24 p-3">
              <span className="material-icons text-2xl mb-1 text-primary">chat</span>
              <span className="text-xs">Text Chat</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-24 p-3">
              <span className="material-icons text-2xl mb-1 text-primary">schedule</span>
              <span className="text-xs">Schedule Call</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-24 p-3">
              <span className="material-icons text-2xl mb-1 text-primary">library_books</span>
              <span className="text-xs">Resources</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-24 p-3">
              <span className="material-icons text-2xl mb-1 text-primary">settings</span>
              <span className="text-xs">Preferences</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}