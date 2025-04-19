## Resources

Expose data and content from your servers to LLMs

Resources are a core primitive in the Model Context Protocol (MCP) that allow servers to expose data and content that can be read by clients and used as context for LLM interactions.

Resources are designed to be application-controlled, meaning that the client application can decide how and when they should be used. Different MCP clients may handle resources differently. For example:

Claude Desktop currently requires users to explicitly select resources before they can be used
Other clients might automatically select resources based on heuristics
Some implementations may even allow the AI model itself to determine which resources to use
Server authors should be prepared to handle any of these interaction patterns when implementing resource support. In order to expose data to models automatically, server authors should use a model-controlled primitive such as Tools.

​
Overview
Resources represent any kind of data that an MCP server wants to make available to clients. This can include:

File contents
Database records
API responses
Live system data
Screenshots and images
Log files
And more
Each resource is identified by a unique URI and can contain either text or binary data.

​
Resource URIs
Resources are identified using URIs that follow this format:

[protocol]://[host]/[path]
For example:

file:///home/user/documents/report.pdf
postgres://database/customers/schema
screen://localhost/display1
The protocol and path structure is defined by the MCP server implementation. Servers can define their own custom URI schemes.

​
Resource types
Resources can contain two types of content:

​
Text resources
Text resources contain UTF-8 encoded text data. These are suitable for:

Source code
Configuration files
Log files
JSON/XML data
Plain text
​
Binary resources
Binary resources contain raw binary data encoded in base64. These are suitable for:

Images
PDFs
Audio files
Video files
Other non-text formats
​
Resource discovery
Clients can discover available resources through two main methods:

​
Direct resources
Servers expose a list of concrete resources via the resources/list endpoint. Each resource includes:

{
uri: string; // Unique identifier for the resource
name: string; // Human-readable name
description?: string; // Optional description
mimeType?: string; // Optional MIME type
}
​
Resource templates
For dynamic resources, servers can expose URI templates that clients can use to construct valid resource URIs:

{
uriTemplate: string; // URI template following RFC 6570
name: string; // Human-readable name for this type
description?: string; // Optional description
mimeType?: string; // Optional MIME type for all matching resources
}
​
Reading resources
To read a resource, clients make a resources/read request with the resource URI.

The server responds with a list of resource contents:

{
contents: [
{
uri: string; // The URI of the resource
mimeType?: string; // Optional MIME type

      // One of:
      text?: string;      // For text resources
      blob?: string;      // For binary resources (base64 encoded)
    }

]
}
Servers may return multiple resources in response to one resources/read request. This could be used, for example, to return a list of files inside a directory when the directory is read.

​
Resource updates
MCP supports real-time updates for resources through two mechanisms:

​
List changes
Servers can notify clients when their list of available resources changes via the notifications/resources/list_changed notification.

​
Content changes
Clients can subscribe to updates for specific resources:

Client sends resources/subscribe with resource URI
Server sends notifications/resources/updated when the resource changes
Client can fetch latest content with resources/read
Client can unsubscribe with resources/unsubscribe
​
Example implementation
Here’s a simple example of implementing resource support in an MCP server:

## Prompts

Create reusable prompt templates and workflows

Prompts enable servers to define reusable prompt templates and workflows that clients can easily surface to users and LLMs. They provide a powerful way to standardize and share common LLM interactions.

Prompts are designed to be user-controlled, meaning they are exposed from servers to clients with the intention of the user being able to explicitly select them for use.

​
Overview
Prompts in MCP are predefined templates that can:

Accept dynamic arguments
Include context from resources
Chain multiple interactions
Guide specific workflows
Surface as UI elements (like slash commands)
​
Prompt structure
Each prompt is defined with:

{
name: string; // Unique identifier for the prompt
description?: string; // Human-readable description
arguments?: [ // Optional list of arguments
{
name: string; // Argument identifier
description?: string; // Argument description
required?: boolean; // Whether argument is required
}
]
}
​
Discovering prompts
Clients can discover available prompts through the prompts/list endpoint:

// Request
{
method: "prompts/list"
}

// Response
{
prompts: [
{
name: "analyze-code",
description: "Analyze code for potential improvements",
arguments: [
{
name: "language",
description: "Programming language",
required: true
}
]
}
]
}
​
Using prompts
To use a prompt, clients make a prompts/get request:

// Request
{
method: "prompts/get",
params: {
name: "analyze-code",
arguments: {
language: "python"
}
}
}

// Response
{
description: "Analyze Python code for potential improvements",
messages: [
{
role: "user",
content: {
type: "text",
text: "Please analyze the following Python code for potential improvements:\n\n`python\ndef calculate_sum(numbers):\n    total = 0\n    for num in numbers:\n        total = total + num\n    return total\n\nresult = calculate_sum([1, 2, 3, 4, 5])\nprint(result)\n`"
}
}
]
}
​
Dynamic prompts
Prompts can be dynamic and include:

​
Embedded resource context

{
"name": "analyze-project",
"description": "Analyze project logs and code",
"arguments": [
{
"name": "timeframe",
"description": "Time period to analyze logs",
"required": true
},
{
"name": "fileUri",
"description": "URI of code file to review",
"required": true
}
]
}
When handling the prompts/get request:

{
"messages": [
{
"role": "user",
"content": {
"type": "text",
"text": "Analyze these system logs and the code file for any issues:"
}
},
{
"role": "user",
"content": {
"type": "resource",
"resource": {
"uri": "logs://recent?timeframe=1h",
"text": "[2024-03-14 15:32:11] ERROR: Connection timeout in network.py:127\n[2024-03-14 15:32:15] WARN: Retrying connection (attempt 2/3)\n[2024-03-14 15:32:20] ERROR: Max retries exceeded",
"mimeType": "text/plain"
}
}
},
{
"role": "user",
"content": {
"type": "resource",
"resource": {
"uri": "file:///path/to/code.py",
"text": "def connect_to_service(timeout=30):\n retries = 3\n for attempt in range(retries):\n try:\n return establish_connection(timeout)\n except TimeoutError:\n if attempt == retries - 1:\n raise\n time.sleep(5)\n\ndef establish_connection(timeout):\n # Connection implementation\n pass",
"mimeType": "text/x-python"
}
}
}
]
}
​
Multi-step workflows

const debugWorkflow = {
name: "debug-error",
async getMessages(error: string) {
return [
{
role: "user",
content: {
type: "text",
text: `Here's an error I'm seeing: ${error}`
}
},
{
role: "assistant",
content: {
type: "text",
text: "I'll help analyze this error. What have you tried so far?"
}
},
{
role: "user",
content: {
type: "text",
text: "I've tried restarting the service, but the error persists."
}
}
];
}
};
​
Example implementation
Here’s a complete example of implementing prompts in an MCP server:

TypeScript
Python

import { Server } from "@modelcontextprotocol/sdk/server";
import {
ListPromptsRequestSchema,
GetPromptRequestSchema
} from "@modelcontextprotocol/sdk/types";

const PROMPTS = {
"git-commit": {
name: "git-commit",
description: "Generate a Git commit message",
arguments: [
{
name: "changes",
description: "Git diff or description of changes",
required: true
}
]
},
"explain-code": {
name: "explain-code",
description: "Explain how code works",
arguments: [
{
name: "code",
description: "Code to explain",
required: true
},
{
name: "language",
description: "Programming language",
required: false
}
]
}
};

const server = new Server({
name: "example-prompts-server",
version: "1.0.0"
}, {
capabilities: {
prompts: {}
}
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
return {
prompts: Object.values(PROMPTS)
};
});

// Get specific prompt
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
const prompt = PROMPTS[request.params.name];
if (!prompt) {
throw new Error(`Prompt not found: ${request.params.name}`);
}

if (request.params.name === "git-commit") {
return {
messages: [
{
role: "user",
content: {
type: "text",
text: `Generate a concise but descriptive commit message for these changes:\n\n${request.params.arguments?.changes}`
}
}
]
};
}

if (request.params.name === "explain-code") {
const language = request.params.arguments?.language || "Unknown";
return {
messages: [
{
role: "user",
content: {
type: "text",
text: `Explain how this ${language} code works:\n\n${request.params.arguments?.code}`
}
}
]
};
}

throw new Error("Prompt implementation not found");
});
​
Best practices
When implementing prompts:

Use clear, descriptive prompt names
Provide detailed descriptions for prompts and arguments
Validate all required arguments
Handle missing arguments gracefully
Consider versioning for prompt templates
Cache dynamic content when appropriate
Implement error handling
Document expected argument formats
Consider prompt composability
Test prompts with various inputs
​
UI integration
Prompts can be surfaced in client UIs as:

Slash commands
Quick actions
Context menu items
Command palette entries
Guided workflows
Interactive forms
​
Updates and changes
Servers can notify clients about prompt changes:

Server capability: prompts.listChanged
Notification: notifications/prompts/list_changed
Client re-fetches prompt list
​
Security considerations
When implementing prompts:

Validate all arguments
Sanitize user input
Consider rate limiting
Implement access controls
Audit prompt usage
Handle sensitive data appropriately
Validate generated content
Implement timeouts
Consider prompt injection risks
Document security requirements

## Tools

Tools
Enable LLMs to perform actions through your server

Tools are a powerful primitive in the Model Context Protocol (MCP) that enable servers to expose executable functionality to clients. Through tools, LLMs can interact with external systems, perform computations, and take actions in the real world.

Tools are designed to be model-controlled, meaning that tools are exposed from servers to clients with the intention of the AI model being able to automatically invoke them (with a human in the loop to grant approval).

​
Overview
Tools in MCP allow servers to expose executable functions that can be invoked by clients and used by LLMs to perform actions. Key aspects of tools include:

Discovery: Clients can list available tools through the tools/list endpoint
Invocation: Tools are called using the tools/call endpoint, where servers perform the requested operation and return results
Flexibility: Tools can range from simple calculations to complex API interactions
Like resources, tools are identified by unique names and can include descriptions to guide their usage. However, unlike resources, tools represent dynamic operations that can modify state or interact with external systems.

​
Tool definition structure
Each tool is defined with the following structure:

{
name: string; // Unique identifier for the tool
description?: string; // Human-readable description
inputSchema: { // JSON Schema for the tool's parameters
type: "object",
properties: { ... } // Tool-specific parameters
}
}
​
Implementing tools
Here’s an example of implementing a basic tool in an MCP server:

TypeScript
Python

const server = new Server({
name: "example-server",
version: "1.0.0"
}, {
capabilities: {
tools: {}
}
});

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
return {
tools: [{
name: "calculate_sum",
description: "Add two numbers together",
inputSchema: {
type: "object",
properties: {
a: { type: "number" },
b: { type: "number" }
},
required: ["a", "b"]
}
}]
};
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
if (request.params.name === "calculate_sum") {
const { a, b } = request.params.arguments;
return {
content: [
{
type: "text",
text: String(a + b)
}
]
};
}
throw new Error("Tool not found");
});
​
Example tool patterns
Here are some examples of types of tools that a server could provide:

​
System operations
Tools that interact with the local system:

{
name: "execute_command",
description: "Run a shell command",
inputSchema: {
type: "object",
properties: {
command: { type: "string" },
args: { type: "array", items: { type: "string" } }
}
}
}
​
API integrations
Tools that wrap external APIs:

{
name: "github_create_issue",
description: "Create a GitHub issue",
inputSchema: {
type: "object",
properties: {
title: { type: "string" },
body: { type: "string" },
labels: { type: "array", items: { type: "string" } }
}
}
}
​
Data processing
Tools that transform or analyze data:

{
name: "analyze_csv",
description: "Analyze a CSV file",
inputSchema: {
type: "object",
properties: {
filepath: { type: "string" },
operations: {
type: "array",
items: {
enum: ["sum", "average", "count"]
}
}
}
}
}
​
Best practices
When implementing tools:

Provide clear, descriptive names and descriptions
Use detailed JSON Schema definitions for parameters
Include examples in tool descriptions to demonstrate how the model should use them
Implement proper error handling and validation
Use progress reporting for long operations
Keep tool operations focused and atomic
Document expected return value structures
Implement proper timeouts
Consider rate limiting for resource-intensive operations
Log tool usage for debugging and monitoring
​
Security considerations
When exposing tools:

​
Input validation
Validate all parameters against the schema
Sanitize file paths and system commands
Validate URLs and external identifiers
Check parameter sizes and ranges
Prevent command injection
​
Access control
Implement authentication where needed
Use appropriate authorization checks
Audit tool usage
Rate limit requests
Monitor for abuse
​
Error handling
Don’t expose internal errors to clients
Log security-relevant errors
Handle timeouts appropriately
Clean up resources after errors
Validate return values
​
Tool discovery and updates
MCP supports dynamic tool discovery:

Clients can list available tools at any time
Servers can notify clients when tools change using notifications/tools/list_changed
Tools can be added or removed during runtime
Tool definitions can be updated (though this should be done carefully)
​
Error handling
Tool errors should be reported within the result object, not as MCP protocol-level errors. This allows the LLM to see and potentially handle the error. When a tool encounters an error:

Set isError to true in the result
Include error details in the content array
Here’s an example of proper error handling for tools:

TypeScript
Python

try {
// Tool operation
const result = performOperation();
return {
content: [
{
type: "text",
text: `Operation successful: ${result}`
}
]
};
} catch (error) {
return {
isError: true,
content: [
{
type: "text",
text: `Error: ${error.message}`
}
]
};
}
This approach allows the LLM to see that an error occurred and potentially take corrective action or request human intervention.

​
Testing tools
A comprehensive testing strategy for MCP tools should cover:

Functional testing: Verify tools execute correctly with valid inputs and handle invalid inputs appropriately
Integration testing: Test tool interaction with external systems using both real and mocked dependencies
Security testing: Validate authentication, authorization, input sanitization, and rate limiting
Performance testing: Check behavior under load, timeout handling, and resource cleanup
Error handling: Ensure tools properly report errors through the MCP protocol and clean up resources

## Sampling

Sampling
Let your servers request completions from LLMs

Sampling is a powerful MCP feature that allows servers to request LLM completions through the client, enabling sophisticated agentic behaviors while maintaining security and privacy.

This feature of MCP is not yet supported in the Claude Desktop client.

​
How sampling works
The sampling flow follows these steps:

Server sends a sampling/createMessage request to the client
Client reviews the request and can modify it
Client samples from an LLM
Client reviews the completion
Client returns the result to the server
This human-in-the-loop design ensures users maintain control over what the LLM sees and generates.

​
Message format
Sampling requests use a standardized message format:

{
messages: [
{
role: "user" | "assistant",
content: {
type: "text" | "image",

        // For text:
        text?: string,

        // For images:
        data?: string,             // base64 encoded
        mimeType?: string
      }
    }

],
modelPreferences?: {
hints?: [{
name?: string // Suggested model name/family
}],
costPriority?: number, // 0-1, importance of minimizing cost
speedPriority?: number, // 0-1, importance of low latency
intelligencePriority?: number // 0-1, importance of capabilities
},
systemPrompt?: string,
includeContext?: "none" | "thisServer" | "allServers",
temperature?: number,
maxTokens: number,
stopSequences?: string[],
metadata?: Record<string, unknown>
}
​
Request parameters
​
Messages
The messages array contains the conversation history to send to the LLM. Each message has:

role: Either “user” or “assistant”
content: The message content, which can be:
Text content with a text field
Image content with data (base64) and mimeType fields
​
Model preferences
The modelPreferences object allows servers to specify their model selection preferences:

hints: Array of model name suggestions that clients can use to select an appropriate model:

name: String that can match full or partial model names (e.g. “claude-3”, “sonnet”)
Clients may map hints to equivalent models from different providers
Multiple hints are evaluated in preference order
Priority values (0-1 normalized):

costPriority: Importance of minimizing costs
speedPriority: Importance of low latency response
intelligencePriority: Importance of advanced model capabilities
Clients make the final model selection based on these preferences and their available models.

​
System prompt
An optional systemPrompt field allows servers to request a specific system prompt. The client may modify or ignore this.

​
Context inclusion
The includeContext parameter specifies what MCP context to include:

"none": No additional context
"thisServer": Include context from the requesting server
"allServers": Include context from all connected MCP servers
The client controls what context is actually included.

​
Sampling parameters
Fine-tune the LLM sampling with:

temperature: Controls randomness (0.0 to 1.0)
maxTokens: Maximum tokens to generate
stopSequences: Array of sequences that stop generation
metadata: Additional provider-specific parameters
​
Response format
The client returns a completion result:

{
model: string, // Name of the model used
stopReason?: "endTurn" | "stopSequence" | "maxTokens" | string,
role: "user" | "assistant",
content: {
type: "text" | "image",
text?: string,
data?: string,
mimeType?: string
}
}
​
Example request
Here’s an example of requesting sampling from a client:

{
"method": "sampling/createMessage",
"params": {
"messages": [
{
"role": "user",
"content": {
"type": "text",
"text": "What files are in the current directory?"
}
}
],
"systemPrompt": "You are a helpful file system assistant.",
"includeContext": "thisServer",
"maxTokens": 100
}
}
​
Best practices
When implementing sampling:

Always provide clear, well-structured prompts
Handle both text and image content appropriately
Set reasonable token limits
Include relevant context through includeContext
Validate responses before using them
Handle errors gracefully
Consider rate limiting sampling requests
Document expected sampling behavior
Test with various model parameters
Monitor sampling costs
​
Human in the loop controls
Sampling is designed with human oversight in mind:

​
For prompts
Clients should show users the proposed prompt
Users should be able to modify or reject prompts
System prompts can be filtered or modified
Context inclusion is controlled by the client
​
For completions
Clients should show users the completion
Users should be able to modify or reject completions
Clients can filter or modify completions
Users control which model is used
​
Security considerations
When implementing sampling:

Validate all message content
Sanitize sensitive information
Implement appropriate rate limits
Monitor sampling usage
Encrypt data in transit
Handle user data privacy
Audit sampling requests
Control cost exposure
Implement timeouts
Handle model errors gracefully
​
Common patterns
​
Agentic workflows
Sampling enables agentic patterns like:

Reading and analyzing resources
Making decisions based on context
Generating structured data
Handling multi-step tasks
Providing interactive assistance
​
Context management
Best practices for context:

Request minimal necessary context
Structure context clearly
Handle context size limits
Update context as needed
Clean up stale context
​
Error handling
Robust error handling should:

Catch sampling failures
Handle timeout errors
Manage rate limits
Validate responses
Provide fallback behaviors
Log errors appropriately
​
Limitations
Be aware of these limitations:

Sampling depends on client capabilities
Users control sampling behavior
Context size has limits
Rate limits may apply
Costs should be considered
Model availability varies
Response times vary
Not all content types supported

## Roots

Roots
Understanding roots in MCP

Roots are a concept in MCP that define the boundaries where servers can operate. They provide a way for clients to inform servers about relevant resources and their locations.

​
What are Roots?
A root is a URI that a client suggests a server should focus on. When a client connects to a server, it declares which roots the server should work with. While primarily used for filesystem paths, roots can be any valid URI including HTTP URLs.

For example, roots could be:

file:///home/user/projects/myapp
https://api.example.com/v1
​
Why Use Roots?
Roots serve several important purposes:

Guidance: They inform servers about relevant resources and locations
Clarity: Roots make it clear which resources are part of your workspace
Organization: Multiple roots let you work with different resources simultaneously
​
How Roots Work
When a client supports roots, it:

Declares the roots capability during connection
Provides a list of suggested roots to the server
Notifies the server when roots change (if supported)
While roots are informational and not strictly enforcing, servers should:

Respect the provided roots
Use root URIs to locate and access resources
Prioritize operations within root boundaries
​
Common Use Cases
Roots are commonly used to define:

Project directories
Repository locations
API endpoints
Configuration locations
Resource boundaries
​
Best Practices
When working with roots:

Only suggest necessary resources
Use clear, descriptive names for roots
Monitor root accessibility
Handle root changes gracefully
​
Example
Here’s how a typical MCP client might expose roots:

{
"roots": [
{
"uri": "file:///home/user/projects/frontend",
"name": "Frontend Repository"
},
{
"uri": "https://api.example.com/v1",
"name": "API Endpoint"
}
]
}
This configuration suggests the server focus on both a local repository and an API endpoint while keeping them logically separated.

## Transports

Transports
Learn about MCP’s communication mechanisms

Transports in the Model Context Protocol (MCP) provide the foundation for communication between clients and servers. A transport handles the underlying mechanics of how messages are sent and received.

​
Message Format
MCP uses JSON-RPC 2.0 as its wire format. The transport layer is responsible for converting MCP protocol messages into JSON-RPC format for transmission and converting received JSON-RPC messages back into MCP protocol messages.

There are three types of JSON-RPC messages used:

​
Requests

{
jsonrpc: "2.0",
id: number | string,
method: string,
params?: object
}
​
Responses

{
jsonrpc: "2.0",
id: number | string,
result?: object,
error?: {
code: number,
message: string,
data?: unknown
}
}
​
Notifications

{
jsonrpc: "2.0",
method: string,
params?: object
}
​
Built-in Transport Types
MCP includes two standard transport implementations:

​
Standard Input/Output (stdio)
The stdio transport enables communication through standard input and output streams. This is particularly useful for local integrations and command-line tools.

Use stdio when:

Building command-line tools
Implementing local integrations
Needing simple process communication
Working with shell scripts
TypeScript (Server)
TypeScript (Client)
Python (Server)
Python (Client)

const server = new Server({
name: "example-server",
version: "1.0.0"
}, {
capabilities: {}
});

const transport = new StdioServerTransport();
await server.connect(transport);
​
Server-Sent Events (SSE)
SSE transport enables server-to-client streaming with HTTP POST requests for client-to-server communication.

Use SSE when:

Only server-to-client streaming is needed
Working with restricted networks
Implementing simple updates
TypeScript (Server)
TypeScript (Client)
Python (Server)
Python (Client)

import express from "express";

const app = express();

const server = new Server({
name: "example-server",
version: "1.0.0"
}, {
capabilities: {}
});

let transport: SSEServerTransport | null = null;

app.get("/sse", (req, res) => {
transport = new SSEServerTransport("/messages", res);
server.connect(transport);
});

app.post("/messages", (req, res) => {
if (transport) {
transport.handlePostMessage(req, res);
}
});

app.listen(3000);
​
Custom Transports
MCP makes it easy to implement custom transports for specific needs. Any transport implementation just needs to conform to the Transport interface:

You can implement custom transports for:

Custom network protocols
Specialized communication channels
Integration with existing systems
Performance optimization
TypeScript
Python

interface Transport {
// Start processing messages
start(): Promise<void>;

// Send a JSON-RPC message
send(message: JSONRPCMessage): Promise<void>;

// Close the connection
close(): Promise<void>;

// Callbacks
onclose?: () => void;
onerror?: (error: Error) => void;
onmessage?: (message: JSONRPCMessage) => void;
}
​
Error Handling
Transport implementations should handle various error scenarios:

Connection errors
Message parsing errors
Protocol errors
Network timeouts
Resource cleanup
Example error handling:

TypeScript
Python

class ExampleTransport implements Transport {
async start() {
try {
// Connection logic
} catch (error) {
this.onerror?.(new Error(`Failed to connect: ${error}`));
throw error;
}
}

async send(message: JSONRPCMessage) {
try {
// Sending logic
} catch (error) {
this.onerror?.(new Error(`Failed to send message: ${error}`));
throw error;
}
}
}
​
Best Practices
When implementing or using MCP transport:

Handle connection lifecycle properly
Implement proper error handling
Clean up resources on connection close
Use appropriate timeouts
Validate messages before sending
Log transport events for debugging
Implement reconnection logic when appropriate
Handle backpressure in message queues
Monitor connection health
Implement proper security measures
​
Security Considerations
When implementing transport:

​
Authentication and Authorization
Implement proper authentication mechanisms
Validate client credentials
Use secure token handling
Implement authorization checks
​
Data Security
Use TLS for network transport
Encrypt sensitive data
Validate message integrity
Implement message size limits
Sanitize input data
​
Network Security
Implement rate limiting
Use appropriate timeouts
Handle denial of service scenarios
Monitor for unusual patterns
Implement proper firewall rules
​
Debugging Transport
Tips for debugging transport issues:

Enable debug logging
Monitor message flow
Check connection states
Validate message formats
Test error scenarios
Use network analysis tools
Implement health checks
Monitor resource usage
Test edge cases
Use proper error tracking
