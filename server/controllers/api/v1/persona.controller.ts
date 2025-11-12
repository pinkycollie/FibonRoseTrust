/**
 * Persona Integration API Controller
 * 
 * Handles identity verification through Persona
 */

import { Request, Response } from 'express';
import { getPersona } from '../../services/persona-integration';
import { storage } from '../../storage';

/**
 * Create a new Persona inquiry for identity verification
 */
export async function createPersonaInquiry(req: Request, res: Response) {
  try {
    const { userId, templateId, redirectUri } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get user information
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create inquiry with Persona
    const persona = getPersona();
    const inquiry = await persona.createInquiry({
      referenceId: `user_${userId}`,
      templateId,
      redirectUri,
      fields: {
        nameFirst: user.name?.split(' ')[0],
        nameLast: user.name?.split(' ').slice(1).join(' '),
        email: user.email,
      }
    });

    // Get session URL
    const sessionUrl = await persona.getInquirySessionUrl(inquiry.id);

    // Create verification record
    const types = await storage.getVerificationTypes();
    const personaType = types.find(t => t.name === 'persona') 
      || await storage.createVerificationType({
        name: 'persona',
        displayName: 'Persona Identity Verification',
        description: 'Identity verification via Persona',
        icon: 'identity'
      });

    const verification = await storage.createVerification({
      userId,
      typeId: personaType.id,
      status: 'PENDING',
      data: {
        inquiryId: inquiry.id,
        sessionUrl
      }
    });

    res.status(201).json({
      success: true,
      data: {
        inquiry,
        verification,
        sessionUrl
      }
    });
  } catch (error) {
    console.error('Error creating Persona inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Persona inquiry',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get Persona inquiry status
 */
export async function getPersonaInquiryStatus(req: Request, res: Response) {
  try {
    const { inquiryId } = req.params;

    if (!inquiryId) {
      return res.status(400).json({
        success: false,
        message: 'Inquiry ID is required'
      });
    }

    const persona = getPersona();
    const inquiry = await persona.getInquiry(inquiryId);

    res.status(200).json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    console.error('Error getting Persona inquiry status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inquiry status',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * List Persona inquiries for a user
 */
export async function listPersonaInquiries(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const persona = getPersona();
    const inquiries = await persona.listInquiries({
      referenceId: `user_${userId}`
    });

    res.status(200).json({
      success: true,
      data: inquiries
    });
  } catch (error) {
    console.error('Error listing Persona inquiries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list inquiries',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Handle Persona webhook events
 */
export async function handlePersonaWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['persona-signature'] as string;
    const webhookSecret = process.env.PERSONA_WEBHOOK_SECRET || '';

    // Verify webhook signature
    const persona = getPersona();
    const payload = JSON.stringify(req.body);
    
    if (webhookSecret && !persona.verifyWebhookSignature(payload, signature, webhookSecret)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Process webhook event
    const event = persona.processWebhookEvent(req.body);

    // Update verification status based on event
    if (event.eventType === 'inquiry.completed' || event.eventType === 'inquiry.approved') {
      // Find verification by inquiry ID
      const verifications = await storage.getVerifications();
      const verification = verifications.find(v => {
        const data = v.data as any;
        return data?.inquiryId === event.inquiryId;
      });

      if (verification) {
        await storage.updateVerificationStatus(
          verification.id,
          event.status === 'passed' ? 'VERIFIED' : 'REJECTED',
          'persona'
        );

        // Update trust score
        await storage.updateTrustScore(verification.userId);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    console.error('Error processing Persona webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Test Persona connection
 */
export async function testPersonaConnection(req: Request, res: Response) {
  try {
    const persona = getPersona();
    const connected = await persona.testConnection();

    if (connected) {
      const accountInfo = await persona.getAccountInfo();
      res.status(200).json({
        success: true,
        message: 'Persona connection successful',
        data: accountInfo
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to connect to Persona'
      });
    }
  } catch (error) {
    console.error('Error testing Persona connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test connection',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
