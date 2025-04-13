import axios from 'axios';
import { NotionIntegration } from '@shared/schema';
import { log } from '../vite';

/**
 * Notion service for interacting with the Notion API
 */
export class NotionService {
  private static baseUrl = 'https://api.notion.com/v1';

  /**
   * Creates a new page in a Notion database
   * @param integration The Notion integration
   * @param properties The page properties
   * @returns The created page
   */
  public static async createDatabaseItem(
    integration: NotionIntegration,
    properties: Record<string, any>
  ): Promise<any> {
    try {
      if (!integration.databaseId) {
        throw new Error('Database ID is required for creating items');
      }

      const response = await axios.post(
        `${this.baseUrl}/pages`,
        {
          parent: { database_id: integration.databaseId },
          properties
        },
        {
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      log(`Error creating Notion database item: ${error}`, 'notion');
      throw error;
    }
  }

  /**
   * Updates a Notion database item
   * @param integration The Notion integration
   * @param pageId The page ID
   * @param properties The updated properties
   * @returns The updated page
   */
  public static async updateDatabaseItem(
    integration: NotionIntegration,
    pageId: string,
    properties: Record<string, any>
  ): Promise<any> {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/pages/${pageId}`,
        { properties },
        {
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      log(`Error updating Notion database item: ${error}`, 'notion');
      throw error;
    }
  }

  /**
   * Queries a Notion database
   * @param integration The Notion integration
   * @param filter Optional filter to apply
   * @param sorts Optional sorts to apply
   * @returns The query results
   */
  public static async queryDatabase(
    integration: NotionIntegration,
    filter?: Record<string, any>,
    sorts?: Array<{ property: string; direction: 'ascending' | 'descending' }>
  ): Promise<any> {
    try {
      if (!integration.databaseId) {
        throw new Error('Database ID is required for querying');
      }

      const response = await axios.post(
        `${this.baseUrl}/databases/${integration.databaseId}/query`,
        {
          filter,
          sorts
        },
        {
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      log(`Error querying Notion database: ${error}`, 'notion');
      throw error;
    }
  }

  /**
   * Converts verification data to Notion properties format
   * @param verificationData The verification data
   * @returns The formatted Notion properties
   */
  public static formatVerificationForNotion(verificationData: any): Record<string, any> {
    return {
      'User': {
        'title': [
          {
            'text': {
              'content': verificationData.userName || 'Unknown'
            }
          }
        ]
      },
      'Status': {
        'select': {
          'name': verificationData.status
        }
      },
      'Type': {
        'select': {
          'name': verificationData.typeName
        }
      },
      'Created': {
        'date': {
          'start': verificationData.createdAt
        }
      },
      'Verified At': {
        'date': {
          'start': verificationData.verifiedAt || null
        }
      },
      'Verified By': {
        'rich_text': [
          {
            'text': {
              'content': verificationData.verifiedBy || ''
            }
          }
        ]
      },
      'Trust Score': {
        'number': verificationData.trustScore || 0
      }
    };
  }

  /**
   * Syncs a verification to Notion
   * @param integration The Notion integration
   * @param verificationData The verification data
   * @returns The synced page
   */
  public static async syncVerificationToNotion(
    integration: NotionIntegration,
    verificationData: any
  ): Promise<any> {
    try {
      const properties = this.formatVerificationForNotion(verificationData);
      
      // Try to find existing verification by external ID
      const filter = {
        'property': 'External ID',
        'rich_text': {
          'equals': String(verificationData.id)
        }
      };
      
      const existingItems = await this.queryDatabase(integration, filter);
      
      if (existingItems.results && existingItems.results.length > 0) {
        const pageId = existingItems.results[0].id;
        return await this.updateDatabaseItem(integration, pageId, properties);
      } else {
        // Add external ID for future updates
        properties['External ID'] = {
          'rich_text': [
            {
              'text': {
                'content': String(verificationData.id)
              }
            }
          ]
        };
        return await this.createDatabaseItem(integration, properties);
      }
    } catch (error) {
      log(`Error syncing verification to Notion: ${error}`, 'notion');
      throw error;
    }
  }
}

/**
 * Convenience function to sync data to Notion
 * @param userId The user ID
 * @param dataType The type of data to sync
 * @param data The data to sync
 */
export async function syncToNotion(
  userId: number,
  dataType: 'verification' | 'trust_score',
  data: any
): Promise<void> {
  try {
    // Find user's Notion integrations
    const notionIntegrations = await import('../storage').then(
      module => module.storage.getNotionIntegrations(userId)
    );
    
    // Skip if no active integrations
    if (!notionIntegrations || notionIntegrations.length === 0) {
      return;
    }
    
    // Process each integration
    for (const integration of notionIntegrations) {
      if (!integration.isActive) {
        continue;
      }
      
      const settings = integration.settings as any;
      
      // Check if this data type should be synced
      if (dataType === 'verification' && settings.syncVerifications) {
        await NotionService.syncVerificationToNotion(integration, data);
      } else if (dataType === 'trust_score' && settings.syncTrustScores) {
        // Could implement trust score sync similarly
      }
    }
  } catch (error) {
    log(`Error in syncToNotion: ${error}`, 'notion');
  }
}