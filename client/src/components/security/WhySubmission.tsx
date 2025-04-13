import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type WhySubmissionMethod = 'text' | 'sms' | 'photo' | 'scan';

interface WhySubmissionProps {
  userId: number;
  onSubmissionComplete?: () => void;
}

export function WhySubmission({ userId, onSubmissionComplete }: WhySubmissionProps) {
  const [selectedMethod, setSelectedMethod] = useState<WhySubmissionMethod>('text');
  const [textMessage, setTextMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const handleTextSubmit = () => {
    if (!textMessage.trim()) return;
    
    setIsSubmitting(true);
    // Simulate API call to submit text WHY explanation
    setTimeout(() => {
      console.log('WHY text submitted:', textMessage);
      setIsSubmitting(false);
      setShowSuccessDialog(true);
      setTextMessage('');
      if (onSubmissionComplete) onSubmissionComplete();
    }, 1000);
  };
  
  const handleSmsSubmit = () => {
    if (!phoneNumber.trim()) return;
    
    setIsSubmitting(true);
    // Simulate API call to send SMS for WHY explanation
    setTimeout(() => {
      console.log('SMS request sent to:', phoneNumber);
      setIsSubmitting(false);
      setShowSuccessDialog(true);
      setPhoneNumber('');
      if (onSubmissionComplete) onSubmissionComplete();
    }, 1000);
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    // Add the selected files to our state
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };
  
  const handleFileSubmit = () => {
    if (uploadedFiles.length === 0) return;
    
    setIsSubmitting(true);
    // Simulate API call to upload files for WHY explanation
    setTimeout(() => {
      console.log('Files uploaded:', uploadedFiles.map(f => f.name));
      setIsSubmitting(false);
      setShowSuccessDialog(true);
      setUploadedFiles([]);
      if (onSubmissionComplete) onSubmissionComplete();
    }, 1500);
  };
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <>
      <Card className="shadow-md border-0">
        <CardHeader className="pb-3 border-b border-muted">
          <CardTitle className="flex items-center">
            <span className="material-icons mr-2 text-primary">question_answer</span>
            WHY Submission
          </CardTitle>
          <CardDescription>
            Explain your unique circumstances to help us understand your situation
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <Alert className="mb-4 bg-primary-50 dark:bg-primary-950/20 border-primary-100 dark:border-primary-900/30">
            <div className="flex items-start">
              <span className="material-icons text-primary mr-2">tips_and_updates</span>
              <div>
                <AlertTitle className="text-sm font-medium">Why use the WHY system?</AlertTitle>
                <AlertDescription className="text-xs">
                  Our WHY system helps us understand circumstances that traditional verification methods 
                  might not account for. Choose the submission method that works best for you.
                </AlertDescription>
              </div>
            </div>
          </Alert>
          
          <Tabs defaultValue="text" onValueChange={(value) => setSelectedMethod(value as WhySubmissionMethod)}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="text" className="flex flex-col h-16 text-[10px] pt-1 pb-0">
                <span className="material-icons mb-1">text_fields</span>
                <span>Text</span>
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex flex-col h-16 text-[10px] pt-1 pb-0">
                <span className="material-icons mb-1">sms</span>
                <span>SMS</span>
              </TabsTrigger>
              <TabsTrigger value="photo" className="flex flex-col h-16 text-[10px] pt-1 pb-0">
                <span className="material-icons mb-1">add_a_photo</span>
                <span>Photo</span>
              </TabsTrigger>
              <TabsTrigger value="scan" className="flex flex-col h-16 text-[10px] pt-1 pb-0">
                <span className="material-icons mb-1">document_scanner</span>
                <span>Scan</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="why-text">Your explanation</Label>
                <Textarea
                  id="why-text"
                  placeholder="Please explain your situation and why traditional verification isn't working for you..."
                  className="min-h-[150px]"
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Be as specific as possible. Include any details about your circumstances 
                  that would help us understand your situation.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="sms" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone-number">Your phone number</Label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10"
                    />
                    <span className="absolute left-3 top-2.5 text-muted-foreground">
                      <span className="material-icons text-sm">phone</span>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send you a text message with a link to submit your WHY explanation securely.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="photo" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="photo-upload">Upload photos</Label>
                <div 
                  className="border-2 border-dashed border-muted rounded-md p-6 text-center hover:bg-muted/5 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    multiple
                    onChange={handleFileUpload}
                  />
                  <span className="material-icons text-3xl text-muted-foreground mb-2">add_a_photo</span>
                  <p className="text-sm">Click to add photos, or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload photos of documents or situations that explain your circumstances
                  </p>
                </div>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded photos</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between bg-muted/30 p-2 rounded-md"
                      >
                        <div className="flex items-center">
                          <span className="material-icons text-muted-foreground mr-2">image</span>
                          <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => removeFile(index)}
                        >
                          <span className="material-icons text-sm">close</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="scan" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scan-upload">Upload document scans</Label>
                <div 
                  className="border-2 border-dashed border-muted rounded-md p-6 text-center hover:bg-muted/5 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('scan-upload')?.click()}
                >
                  <input
                    id="scan-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    multiple
                    onChange={handleFileUpload}
                  />
                  <span className="material-icons text-3xl text-muted-foreground mb-2">document_scanner</span>
                  <p className="text-sm">Click to add scanned documents, or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload scans of official documents, letters, or any supporting materials
                  </p>
                </div>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded documents</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between bg-muted/30 p-2 rounded-md"
                      >
                        <div className="flex items-center">
                          <span className="material-icons text-muted-foreground mr-2">
                            {file.type.includes('pdf') ? 'picture_as_pdf' : 'description'}
                          </span>
                          <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => removeFile(index)}
                        >
                          <span className="material-icons text-sm">close</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t bg-muted/30 pt-3 pb-3 gap-2 justify-end">
          {selectedMethod === 'text' && (
            <Button 
              onClick={handleTextSubmit} 
              disabled={!textMessage.trim() || isSubmitting}
              className="gap-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span className="material-icons text-sm">send</span>
                  <span>Submit Explanation</span>
                </>
              )}
            </Button>
          )}
          
          {selectedMethod === 'sms' && (
            <Button 
              onClick={handleSmsSubmit} 
              disabled={!phoneNumber.trim() || isSubmitting}
              className="gap-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span className="material-icons text-sm">sms</span>
                  <span>Send Text Link</span>
                </>
              )}
            </Button>
          )}
          
          {(selectedMethod === 'photo' || selectedMethod === 'scan') && (
            <Button 
              onClick={handleFileSubmit} 
              disabled={uploadedFiles.length === 0 || isSubmitting}
              className="gap-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span className="material-icons text-sm">cloud_upload</span>
                  <span>Upload {selectedMethod === 'photo' ? 'Photos' : 'Documents'}</span>
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="material-icons text-emerald-500 mr-2">check_circle</span>
              WHY Submission Received
            </DialogTitle>
            <DialogDescription>
              Thank you for explaining your situation to us.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-md p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-center">
              <p className="text-sm">
                Your submission has been received and will be reviewed within 1-2 business days.
                We'll notify you once we've processed your information.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowSuccessDialog(false)}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}