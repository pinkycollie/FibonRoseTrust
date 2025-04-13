import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function ApiIntegrations() {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">API Integrations</h1>
        
        <Alert className="mt-6 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <span className="material-icons mr-2">api</span>
          <AlertTitle>NegraSecurity Framework Integration</AlertTitle>
          <AlertDescription>
            FibonRoseID provides secure identity verification APIs for the NegraSecurity framework.
          </AlertDescription>
        </Alert>

        <div className="mt-6">
          <Tabs defaultValue="endpoints">
            <TabsList className="mb-6">
              <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="examples">Code Examples</TabsTrigger>
            </TabsList>
            
            <TabsContent value="endpoints">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Available Endpoints</h2>
                  <CardDescription>
                    REST endpoints that other NegraSecurity modules can call for verification checks.
                  </CardDescription>
                </CardHeader>
                <CardContent className="border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-6">
                    <ApiEndpoint 
                      method="GET"
                      path="/api/user/:userId/trust-score"
                      description="Get a user's trust score with Fibonacci progression details."
                      responseExample={`{
  "id": 1,
  "userId": 1,
  "score": 89,
  "level": 11,
  "maxScore": 144,
  "verificationCount": 3,
  "positiveTransactions": 34,
  "totalTransactions": 68,
  "lastUpdated": "2023-06-15T10:30:00Z"
}`}
                    />
                    
                    <ApiEndpoint 
                      method="GET"
                      path="/api/user/:userId/verifications"
                      description="Get all verifications for a user."
                      responseExample={`[
  {
    "id": 1,
    "userId": 1,
    "typeId": 1,
    "status": "VERIFIED",
    "verifiedBy": "Biometric System",
    "createdAt": "2022-12-05T14:22:11Z",
    "verifiedAt": "2022-12-05T14:25:30Z"
  }
]`}
                    />
                    
                    <ApiEndpoint 
                      method="POST"
                      path="/api/verification"
                      description="Create a new verification request."
                      requestExample={`{
  "userId": 1,
  "typeId": 2,
  "status": "PENDING",
  "data": {
    "walletAddress": "0x1234..."
  }
}`}
                      responseExample={`{
  "id": 4,
  "userId": 1,
  "typeId": 2,
  "status": "PENDING",
  "data": {
    "walletAddress": "0x1234..."
  },
  "createdAt": "2023-06-15T14:22:11Z",
  "verifiedAt": null
}`}
                    />
                    
                    <ApiEndpoint 
                      method="PATCH"
                      path="/api/verification/:id/status"
                      description="Update the status of a verification."
                      requestExample={`{
  "status": "VERIFIED",
  "verifiedBy": "NegraSecurity Authentication Service"
}`}
                      responseExample={`{
  "id": 4,
  "userId": 1,
  "typeId": 2,
  "status": "VERIFIED",
  "verifiedBy": "NegraSecurity Authentication Service",
  "data": {
    "walletAddress": "0x1234..."
  },
  "createdAt": "2023-06-15T14:22:11Z",
  "verifiedAt": "2023-06-15T14:25:30Z"
}`}
                    />
                    
                    <ApiEndpoint 
                      method="GET"
                      path="/api/user/:userId/data-permissions"
                      description="Get a user's data visibility permissions."
                      responseExample={`[
  {
    "id": 1,
    "userId": 1,
    "permissionKey": "basic_profile",
    "enabled": true
  },
  {
    "id": 2,
    "userId": 1,
    "permissionKey": "verification_status",
    "enabled": true
  }
]`}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="authentication">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Authentication</h2>
                  <CardDescription>
                    Secure your API requests with JWT authentication.
                  </CardDescription>
                </CardHeader>
                <CardContent className="border-t border-gray-200 dark:border-gray-700">
                  <div className="prose dark:prose-invert max-w-none">
                    <h3 className="text-base font-medium">JWT Authentication</h3>
                    <p>
                      All API requests must include a valid JWT token in the Authorization header:
                    </p>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-sm overflow-x-auto">
                      Authorization: Bearer {'{your_jwt_token}'}
                    </pre>

                    <h3 className="text-base font-medium mt-6">Obtaining a Token</h3>
                    <p>
                      Generate a JWT token by making a POST request to the authentication endpoint:
                    </p>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-sm overflow-x-auto">
                      POST /api/auth/token
                      {'\n\n'}
                      {
`{
  "apiKey": "your_api_key",
  "apiSecret": "your_api_secret"
}`
                      }
                    </pre>

                    <h3 className="text-base font-medium mt-6">Token Expiration</h3>
                    <p>
                      JWT tokens expire after 24 hours. Your application should refresh tokens before they expire.
                    </p>

                    <Alert className="mt-6">
                      <AlertTitle>Security Note</AlertTitle>
                      <AlertDescription>
                        Never expose your API secret in client-side code. Always make authentication requests from your server.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="examples">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Code Examples</h2>
                  <CardDescription>
                    Sample code for integrating with the FibonRoseID API.
                  </CardDescription>
                </CardHeader>
                <CardContent className="border-t border-gray-200 dark:border-gray-700">
                  <div className="prose dark:prose-invert max-w-none">
                    <h3 className="text-base font-medium">JavaScript/Node.js</h3>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-sm overflow-x-auto">
                      {
`// Get a user's trust score
async function getUserTrustScore(userId) {
  const response = await fetch(\`https://api.fibonroseid.com/api/user/\${userId}/trust-score\`, {
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(\`Error: \${response.status}\`);
  }
  
  return await response.json();
}`
                      }
                    </pre>

                    <h3 className="text-base font-medium mt-6">Python</h3>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-sm overflow-x-auto">
                      {
`import requests

def get_user_trust_score(user_id, token):
    url = f"https://api.fibonroseid.com/api/user/{user_id}/trust-score"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    return response.json()`
                      }
                    </pre>

                    <h3 className="text-base font-medium mt-6">Java</h3>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-sm overflow-x-auto">
                      {
`import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public TrustScore getUserTrustScore(int userId, String token) throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("https://api.fibonroseid.com/api/user/" + userId + "/trust-score"))
        .header("Authorization", "Bearer " + token)
        .header("Content-Type", "application/json")
        .GET()
        .build();
    
    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    
    if (response.statusCode() != 200) {
        throw new Exception("Error: " + response.statusCode());
    }
    
    // Parse JSON response to TrustScore object
    return parseJson(response.body());
}`
                      }
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

type ApiEndpointProps = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  requestExample?: string;
  responseExample: string;
};

function ApiEndpoint({ method, path, description, requestExample, responseExample }: ApiEndpointProps) {
  const methodColors: Record<string, string> = {
    'GET': 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
    'POST': 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
    'PUT': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
    'PATCH': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
    'DELETE': 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
  };

  return (
    <div>
      <div className="flex items-center">
        <div className={`px-2 py-1 text-xs font-medium rounded ${methodColors[method]}`}>
          {method}
        </div>
        <code className="ml-2 font-mono text-sm">{path}</code>
      </div>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      
      {requestExample && (
        <>
          <div className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">Request Body:</div>
          <div className="mt-1 rounded-md bg-gray-50 dark:bg-gray-800 p-2">
            <pre className="text-xs font-mono overflow-x-auto">{requestExample}</pre>
          </div>
        </>
      )}
      
      <div className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">Response:</div>
      <div className="mt-1 rounded-md bg-gray-50 dark:bg-gray-800 p-2">
        <pre className="text-xs font-mono overflow-x-auto">{responseExample}</pre>
      </div>
      
      <Separator className="mt-6" />
    </div>
  );
}
