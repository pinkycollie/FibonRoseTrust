/**
 * Partnership Automation Service
 * Coordinates services with business partners for VR clients
 */

export interface Partner {
  id: string;
  name: string;
  serviceTypes: string[];
  contactEmail: string;
  apiEndpoint?: string;
  isActive: boolean;
  rating: number;
  responseTime: number; // average response time in hours
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  partnerId: string;
  serviceType: string;
  requirements: Record<string, unknown>;
  timeline: ServiceTimeline;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface ServiceTimeline {
  requestedStartDate: string;
  estimatedDuration: number; // in days
  milestones: Array<{
    name: string;
    dueDate: string;
    status: 'pending' | 'completed';
  }>;
  actualStartDate?: string;
  actualEndDate?: string;
}

export interface ClientNeeds {
  id: string;
  clientId: string;
  businessType: string;
  disabilityType: string;
  requiredServices: string[];
  budget?: number;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  specialRequirements?: string[];
}

export interface ServicePlan {
  id: string;
  clientId: string;
  services: Array<{
    serviceType: string;
    partnerId: string;
    partnerName: string;
    estimatedCost?: number;
    timeline: ServiceTimeline;
    priority: number;
  }>;
  totalEstimatedCost?: number;
  createdAt: string;
}

export class PartnershipAutomation {
  private partners: Map<string, Partner>;
  private serviceRequests: Map<string, ServiceRequest>;
  private servicePlans: Map<string, ServicePlan>;
  private serviceMatrix: Map<string, string[]>; // serviceType -> partnerIds

  constructor() {
    this.partners = new Map();
    this.serviceRequests = new Map();
    this.servicePlans = new Map();
    this.serviceMatrix = new Map();
    this.initializeDefaultPartners();
  }

  /**
   * Initialize default partner network
   */
  private initializeDefaultPartners(): void {
    const defaultPartners: Partner[] = [
      {
        id: 'partner_sbdc',
        name: 'Small Business Development Center',
        serviceTypes: ['business_planning', 'mentoring', 'training'],
        contactEmail: 'services@sbdc.org',
        isActive: true,
        rating: 4.8,
        responseTime: 24
      },
      {
        id: 'partner_score',
        name: 'SCORE Mentorship Program',
        serviceTypes: ['mentoring', 'business_planning', 'consulting'],
        contactEmail: 'mentors@score.org',
        isActive: true,
        rating: 4.7,
        responseTime: 48
      },
      {
        id: 'partner_voc_rehab',
        name: 'Vocational Rehabilitation Services',
        serviceTypes: ['assistive_technology', 'training', 'job_placement'],
        contactEmail: 'services@vr.gov',
        isActive: true,
        rating: 4.5,
        responseTime: 72
      },
      {
        id: 'partner_disability_employment',
        name: 'Disability Employment Initiative',
        serviceTypes: ['job_placement', 'training', 'accommodations'],
        contactEmail: 'dei@employment.org',
        isActive: true,
        rating: 4.6,
        responseTime: 48
      },
      {
        id: 'partner_at_center',
        name: 'Assistive Technology Center',
        serviceTypes: ['assistive_technology', 'training', 'equipment'],
        contactEmail: 'services@atcenter.org',
        isActive: true,
        rating: 4.9,
        responseTime: 24
      },
      {
        id: 'partner_microenterprise',
        name: 'Microenterprise Development Program',
        serviceTypes: ['business_planning', 'funding', 'training'],
        contactEmail: 'programs@microenterprise.org',
        isActive: true,
        rating: 4.4,
        responseTime: 72
      },
      {
        id: 'partner_legal_aid',
        name: 'Disability Legal Aid Services',
        serviceTypes: ['legal', 'advocacy', 'compliance'],
        contactEmail: 'legal@disabilityrights.org',
        isActive: true,
        rating: 4.7,
        responseTime: 48
      },
      {
        id: 'partner_financial_services',
        name: 'Accessible Financial Services',
        serviceTypes: ['funding', 'financial_planning', 'accounting'],
        contactEmail: 'finance@accessiblefinance.org',
        isActive: true,
        rating: 4.5,
        responseTime: 24
      }
    ];

    for (const partner of defaultPartners) {
      this.partners.set(partner.id, partner);
      
      // Build service matrix
      for (const serviceType of partner.serviceTypes) {
        const existing = this.serviceMatrix.get(serviceType) || [];
        existing.push(partner.id);
        this.serviceMatrix.set(serviceType, existing);
      }
    }
  }

  /**
   * Match client needs to available services and partners
   */
  async matchServices(clientNeeds: ClientNeeds): Promise<ServicePlan> {
    const servicePlanId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const matchedServices: ServicePlan['services'] = [];

    let priority = 1;

    for (const requiredService of clientNeeds.requiredServices) {
      const bestPartner = await this.findBestPartner(
        requiredService,
        clientNeeds.urgency,
        clientNeeds.specialRequirements
      );

      if (bestPartner) {
        const timeline = this.generateTimeline(requiredService, clientNeeds.urgency);

        matchedServices.push({
          serviceType: requiredService,
          partnerId: bestPartner.id,
          partnerName: bestPartner.name,
          timeline,
          priority: priority++
        });
      }
    }

    const servicePlan: ServicePlan = {
      id: servicePlanId,
      clientId: clientNeeds.clientId,
      services: matchedServices,
      createdAt: new Date().toISOString()
    };

    this.servicePlans.set(servicePlanId, servicePlan);
    return servicePlan;
  }

  /**
   * Find the best partner for a service type
   */
  private async findBestPartner(
    serviceType: string,
    urgency: string,
    specialRequirements?: string[]
  ): Promise<Partner | null> {
    const partnerIds = this.serviceMatrix.get(serviceType);
    if (!partnerIds || partnerIds.length === 0) {
      return null;
    }

    // Get active partners that offer this service
    const eligiblePartners = partnerIds
      .map(id => this.partners.get(id))
      .filter((p): p is Partner => p !== undefined && p.isActive);

    if (eligiblePartners.length === 0) {
      return null;
    }

    // Score partners based on criteria
    const scoredPartners = eligiblePartners.map(partner => {
      let score = partner.rating * 20; // Base score from rating (max 100)

      // Adjust for urgency - prefer faster response times
      if (urgency === 'urgent' || urgency === 'high') {
        score += (96 - partner.responseTime) / 2; // Bonus for fast response
      }

      // Check special requirements match (simplified)
      if (specialRequirements && specialRequirements.length > 0) {
        const matchedRequirements = specialRequirements.filter(
          req => partner.serviceTypes.includes(req)
        );
        score += matchedRequirements.length * 5;
      }

      return { partner, score };
    });

    // Sort by score and return the best
    scoredPartners.sort((a, b) => b.score - a.score);
    return scoredPartners[0].partner;
  }

  /**
   * Generate timeline for a service
   */
  private generateTimeline(serviceType: string, urgency: string): ServiceTimeline {
    const baseDurations: Record<string, number> = {
      business_planning: 30,
      mentoring: 90,
      training: 60,
      assistive_technology: 14,
      job_placement: 45,
      funding: 30,
      legal: 21,
      consulting: 30,
      accommodations: 14,
      equipment: 7,
      compliance: 14,
      advocacy: 30,
      financial_planning: 21,
      accounting: 14
    };

    const urgencyMultipliers: Record<string, number> = {
      urgent: 0.5,
      high: 0.7,
      normal: 1.0,
      low: 1.5
    };

    const baseDuration = baseDurations[serviceType] || 30;
    const multiplier = urgencyMultipliers[urgency] || 1.0;
    const estimatedDuration = Math.ceil(baseDuration * multiplier);

    const requestedStartDate = new Date();
    requestedStartDate.setDate(requestedStartDate.getDate() + 3); // Start in 3 days

    // Create milestones
    const milestones = [
      {
        name: 'Initial Assessment',
        dueDate: new Date(requestedStartDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending' as const
      },
      {
        name: 'Service Delivery',
        dueDate: new Date(requestedStartDate.getTime() + (estimatedDuration * 0.5) * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending' as const
      },
      {
        name: 'Completion Review',
        dueDate: new Date(requestedStartDate.getTime() + estimatedDuration * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending' as const
      }
    ];

    return {
      requestedStartDate: requestedStartDate.toISOString(),
      estimatedDuration,
      milestones
    };
  }

  /**
   * Coordinate services - initiate service requests with partners
   */
  async coordinateServices(clientNeeds: ClientNeeds): Promise<ServicePlan> {
    const servicePlan = await this.matchServices(clientNeeds);

    // Initiate service requests for each matched service
    for (const service of servicePlan.services) {
      await this.initiateService({
        clientId: clientNeeds.id,
        serviceType: service.serviceType,
        requirements: {
          businessType: clientNeeds.businessType,
          disabilityType: clientNeeds.disabilityType,
          specialRequirements: clientNeeds.specialRequirements,
          budget: clientNeeds.budget
        },
        timeline: service.timeline,
        partnerId: service.partnerId
      });
    }

    return servicePlan;
  }

  /**
   * Initiate a service with a partner
   */
  private async initiateService(params: {
    clientId: string;
    serviceType: string;
    requirements: Record<string, unknown>;
    timeline: ServiceTimeline;
    partnerId: string;
  }): Promise<ServiceRequest> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const serviceRequest: ServiceRequest = {
      id: requestId,
      clientId: params.clientId,
      partnerId: params.partnerId,
      serviceType: params.serviceType,
      requirements: params.requirements,
      timeline: params.timeline,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.serviceRequests.set(requestId, serviceRequest);

    // In production, this would make an API call or send notification to the partner
    console.log(`Service request ${requestId} initiated with partner ${params.partnerId}`);

    // Simulate partner API notification
    await this.notifyPartner(params.partnerId, serviceRequest);

    return serviceRequest;
  }

  /**
   * Notify partner of new service request
   */
  private async notifyPartner(partnerId: string, request: ServiceRequest): Promise<void> {
    const partner = this.partners.get(partnerId);
    if (!partner) {
      console.warn(`Partner ${partnerId} not found`);
      return;
    }

    // In production, this would:
    // 1. Call partner's API if available
    // 2. Send email notification
    // 3. Create webhook event
    console.log(`Notifying partner ${partner.name} (${partner.contactEmail}) about request ${request.id}`);

    // Simulate async notification
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Update service request status
   */
  updateServiceStatus(
    requestId: string,
    status: ServiceRequest['status'],
    notes?: string
  ): ServiceRequest | null {
    const request = this.serviceRequests.get(requestId);
    if (!request) {
      return null;
    }

    request.status = status;
    request.updatedAt = new Date().toISOString();

    if (status === 'in_progress') {
      request.timeline.actualStartDate = new Date().toISOString();
    } else if (status === 'completed') {
      request.timeline.actualEndDate = new Date().toISOString();
    }

    this.serviceRequests.set(requestId, request);

    console.log(`Service request ${requestId} updated to ${status}${notes ? `: ${notes}` : ''}`);

    return request;
  }

  /**
   * Get service plan by ID
   */
  getServicePlan(planId: string): ServicePlan | undefined {
    return this.servicePlans.get(planId);
  }

  /**
   * Get all service plans for a client
   */
  getClientServicePlans(clientId: string): ServicePlan[] {
    return Array.from(this.servicePlans.values())
      .filter(plan => plan.clientId === clientId);
  }

  /**
   * Get service request by ID
   */
  getServiceRequest(requestId: string): ServiceRequest | undefined {
    return this.serviceRequests.get(requestId);
  }

  /**
   * Get all service requests for a client
   */
  getClientServiceRequests(clientId: string): ServiceRequest[] {
    return Array.from(this.serviceRequests.values())
      .filter(request => request.clientId === clientId);
  }

  /**
   * Get partner by ID
   */
  getPartner(partnerId: string): Partner | undefined {
    return this.partners.get(partnerId);
  }

  /**
   * Get all active partners
   */
  getActivePartners(): Partner[] {
    return Array.from(this.partners.values())
      .filter(partner => partner.isActive);
  }

  /**
   * Get partners by service type
   */
  getPartnersByService(serviceType: string): Partner[] {
    const partnerIds = this.serviceMatrix.get(serviceType) || [];
    return partnerIds
      .map(id => this.partners.get(id))
      .filter((p): p is Partner => p !== undefined && p.isActive);
  }

  /**
   * Register a new partner
   */
  registerPartner(partner: Omit<Partner, 'id'>): Partner {
    const id = `partner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPartner: Partner = { ...partner, id };
    
    this.partners.set(id, newPartner);

    // Update service matrix
    for (const serviceType of partner.serviceTypes) {
      const existing = this.serviceMatrix.get(serviceType) || [];
      existing.push(id);
      this.serviceMatrix.set(serviceType, existing);
    }

    return newPartner;
  }

  /**
   * Update partner status
   */
  updatePartnerStatus(partnerId: string, isActive: boolean): Partner | null {
    const partner = this.partners.get(partnerId);
    if (!partner) {
      return null;
    }

    partner.isActive = isActive;
    this.partners.set(partnerId, partner);
    return partner;
  }
}

export const partnershipAutomation = new PartnershipAutomation();
