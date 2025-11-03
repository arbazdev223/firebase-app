import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core';
import Oas from 'oas';
import APICore from 'api/dist/core';
declare class SDK {
    spec: Oas;
    core: APICore;
    constructor();
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    config(config: ConfigOptions): void;
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    auth(...values: string[] | number[]): this;
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    server(url: string, variables?: {}): void;
    /**
     * Send Whatsapp Template Message
     *
     * @summary Send Whatsapp Template Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappTemplateResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappTemplateResponse401> Unauthorized
     */
    outgoingMessagesWhatsappTemplate(body: types.OutgoingMessagesWhatsappTemplateBodyParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Send Whatsapp Text Message
     *
     * @summary Send Whatsapp Text Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappTextResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappTextResponse401> Unauthorized
     */
    outgoingMessagesWhatsappText(body: types.OutgoingMessagesWhatsappTextBodyParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Export Chats For a WabaNumber
     *
     * @summary Export Chats For a Customer For Given WabaNumber
     * @throws FetchError<400, types.ExportChatsToExcelResponse400> Incorrect payload
     * @throws FetchError<401, types.ExportChatsToExcelResponse401> Unauthorized
     */
    exportChatsToExcel(body: types.ExportChatsToExcelBodyParam): Promise<FetchResponse<201, types.ExportChatsToExcelResponse201>>;
    /**
     * Retrieve chat messages sent by the specified WhatsApp Business Account (WABA) number,
     * with optional date filtering.
     *
     * @summary Get chat messages for a customer of WABA number
     * @throws FetchError<400, types.GetChatMessagesResponse400> Incorrect payload
     * @throws FetchError<401, types.GetChatMessagesResponse401> Unauthorized
     */
    getChatMessages(metadata: types.GetChatMessagesMetadataParam): Promise<FetchResponse<200, types.GetChatMessagesResponse200>>;
    /**
     * Send Whatsapp Video Message
     *
     * @summary Send Whatsapp Video Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappVideoResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappVideoResponse401> Unauthorized
     */
    outgoingMessagesWhatsappVideo(body: types.OutgoingMessagesWhatsappVideoBodyParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Send Whatsapp Audio Message
     *
     * @summary Send Whatsapp Audio Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappAudioResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappAudioResponse401> Unauthorized
     */
    outgoingMessagesWhatsappAudio(body: types.OutgoingMessagesWhatsappAudioBodyParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Send Whatsapp Image Message
     *
     * @summary Send Whatsapp Image Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappImageResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappImageResponse401> Unauthorized
     */
    outgoingMessagesWhatsappImage(body: types.OutgoingMessagesWhatsappImageBodyParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Send Whatsapp Document Message
     *
     * @summary Send Whatsapp Document Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappDocumentResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappDocumentResponse401> Unauthorized
     */
    outgoingMessagesWhatsappDocument(body: types.OutgoingMessagesWhatsappDocumentBodyParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Send Whatsapp Location Message
     *
     * @summary Send Whatsapp Location Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappLocationResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappLocationResponse401> Unauthorized
     */
    outgoingMessagesWhatsappLocation(body: types.OutgoingMessagesWhatsappLocationBodyParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Send Whatsapp Interactive Button Message
     *
     * @summary Send Whatsapp Interactive Button Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappInteractiveResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappInteractiveResponse401> Unauthorized
     */
    outgoingMessagesWhatsappInteractive(body: types.OutgoingMessagesWhatsappInteractiveBodyParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Send Whatsapp Interactive List Message
     *
     * @summary Send Whatsapp Interactive List Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappInteractiveListResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappInteractiveListResponse401> Unauthorized
     */
    outgoingMessagesWhatsappInteractiveList(body: types.OutgoingMessagesWhatsappInteractiveListBodyParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Send a template WhatsApp message to a broadcast group. When using placeholders in your
     * message, please follow the format outlined below:
     *
     * - {{Name}}: Used to include the name of the customer.
     * - {{Phone Number}}: Used to include the phone number of the customer.
     * - {{<Custom Field Name>}}: Used to include custom fields. This will only function
     * correctly if the custom field has been set for all customers within the broadcast group.
     *
     * @summary Send Template Whatsapp Message to Broadcast Group
     */
    sendBroadcastMessage(body: types.SendBroadcastMessageBodyParam): Promise<FetchResponse<200, types.SendBroadcastMessageResponse200>>;
    /**
     * Create New Template
     *
     * @summary Create New Template
     * @throws FetchError<400, types.CreateTemplateResponse400> Incorrect payload
     * @throws FetchError<401, types.CreateTemplateResponse401> Unauthorized
     */
    createTemplate(body: types.CreateTemplateBodyParam): Promise<FetchResponse<201, types.CreateTemplateResponse201>>;
    /**
     * Delete Template
     *
     * @summary Delete Template
     * @throws FetchError<400, types.DeleteTemplateResponse400> Incorrect payload
     * @throws FetchError<401, types.DeleteTemplateResponse401> Unauthorized
     */
    deleteTemplate(body: types.DeleteTemplateBodyParam): Promise<FetchResponse<201, types.DeleteTemplateResponse201>>;
    /**
     * Edit Template
     *
     * @summary Edit Template
     * @throws FetchError<400, types.EditTemplateResponse400> Incorrect payload
     * @throws FetchError<401, types.EditTemplateResponse401> Unauthorized
     */
    editTemplate(body: types.EditTemplateBodyParam, metadata: types.EditTemplateMetadataParam): Promise<FetchResponse<201, types.EditTemplateResponse201>>;
    /**
     * Get Templates
     *
     * @summary Get Templates
     * @throws FetchError<400, types.GetTemplatesResponse400> Incorrect payload
     * @throws FetchError<401, types.GetTemplatesResponse401> Unauthorized
     */
    getTemplates(metadata?: types.GetTemplatesMetadataParam): Promise<FetchResponse<201, types.GetTemplatesResponse201>>;
    /**
     * Get details of customer along with custom fields
     *
     * @summary Get customer details
     * @throws FetchError<400, types.GetCustomerDetailsResponse400> Incorrect payload
     * @throws FetchError<401, types.GetCustomerDetailsResponse401> Unauthorized
     * @throws FetchError<404, types.GetCustomerDetailsResponse404> NotFound
     */
    getCustomerDetails(metadata?: types.GetCustomerDetailsMetadataParam): Promise<FetchResponse<200, types.GetCustomerDetailsResponse200>>;
    /**
     * Assign Custom Fields and/or Tags to Customer
     *
     * @summary Assign Custom Fields and/or Tags to Customer
     * @throws FetchError<400, types.CustomerAssignTagsCustomFieldsResponse400> Incorrect payload
     * @throws FetchError<401, types.CustomerAssignTagsCustomFieldsResponse401> Unauthorized
     */
    customerAssignTagsCustomFields(body: types.CustomerAssignTagsCustomFieldsBodyParam): Promise<FetchResponse<201, types.CustomerAssignTagsCustomFieldsResponse201>>;
    /**
     * Remove Custom Fields and/or Tags from Customer
     *
     * @summary Remove Custom Fields and/or Tags from Customer
     * @throws FetchError<400, types.CustomerRemoveTagsCustomFieldsResponse400> Incorrect payload
     * @throws FetchError<401, types.CustomerRemoveTagsCustomFieldsResponse401> Unauthorized
     */
    customerRemoveTagsCustomFields(body: types.CustomerRemoveTagsCustomFieldsBodyParam): Promise<FetchResponse<201, types.CustomerRemoveTagsCustomFieldsResponse201>>;
    /**
     * Block customer using phone number
     *
     * @summary Block a customer
     * @throws FetchError<400, types.BlockUnblockCustomerResponse400> Incorrect payload
     * @throws FetchError<401, types.BlockUnblockCustomerResponse401> Unauthorized
     * @throws FetchError<404, types.BlockUnblockCustomerResponse404> NotFound
     */
    blockUnblockCustomer(body: types.BlockUnblockCustomerBodyParam): Promise<FetchResponse<201, types.BlockUnblockCustomerResponse201>>;
    /**
     * Unblock customer using phone number
     *
     * @summary Unblock a customer
     * @throws FetchError<400, types.UnblockUnblockCustomerResponse400> Incorrect payload
     * @throws FetchError<401, types.UnblockUnblockCustomerResponse401> Unauthorized
     * @throws FetchError<404, types.UnblockUnblockCustomerResponse404> NotFound
     */
    unblockUnblockCustomer(body: types.UnblockUnblockCustomerBodyParam): Promise<FetchResponse<201, types.UnblockUnblockCustomerResponse201>>;
    /**
     * Assign team member to chat
     *
     * @summary Assign team member to chat
     * @throws FetchError<400, types.AssignTeamMemberToChatResponse400> Incorrect payload
     * @throws FetchError<401, types.AssignTeamMemberToChatResponse401> Unauthorized
     * @throws FetchError<422, types.AssignTeamMemberToChatResponse422> User is not a member of the team
     */
    assignTeamMemberToChat(body: types.AssignTeamMemberToChatBodyParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Unassign team member from a chat
     *
     * @summary Unssign team member from a chat
     * @throws FetchError<400, types.UnassignTeamMemberFromChatResponse400> Incorrect payload
     * @throws FetchError<401, types.UnassignTeamMemberFromChatResponse401> Unauthorized
     * @throws FetchError<422, types.UnassignTeamMemberFromChatResponse422> User is not a member of the team
     */
    unassignTeamMemberFromChat(body: types.UnassignTeamMemberFromChatBodyParam): Promise<FetchResponse<201, types.UnassignTeamMemberFromChatResponse201>>;
    /**
     * Logout a team member
     *
     * @summary Logout a team member
     * @throws FetchError<400, types.LogoutTeamMemberResponse400> Incorrect payload
     * @throws FetchError<401, types.LogoutTeamMemberResponse401> Unauthorized
     * @throws FetchError<422, types.LogoutTeamMemberResponse422> User is not a member of the team
     */
    logoutTeamMember(body: types.LogoutTeamMemberBodyParam): Promise<FetchResponse<201, types.LogoutTeamMemberResponse201>>;
    /**
     * Check reverted on time
     *
     * @summary Check reverted on time
     * @throws FetchError<400, types.CheckRevertedOnTimeResponse400> Incorrect payload
     * @throws FetchError<401, types.CheckRevertedOnTimeResponse401> Unauthorized
     */
    checkRevertedOnTime(body: types.CheckRevertedOnTimeBodyParam): Promise<FetchResponse<201, types.CheckRevertedOnTimeResponse201>>;
    /**
     * Create a new group
     *
     * @summary Create a new group
     */
    createGroup(body: types.CreateGroupBodyParam): Promise<FetchResponse<201, types.CreateGroupResponse201>>;
    /**
     * Deletes multiple groups
     *
     * @summary Delete groups
     */
    deleteGroups(body: types.DeleteGroupsBodyParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Returns a list of paginated groups based on search criteria and pagination parameters
     *
     * @summary Get paginated groups
     */
    getPaginatedGroupsV2(metadata?: types.GetPaginatedGroupsV2MetadataParam): Promise<FetchResponse<200, types.GetPaginatedGroupsV2Response200>>;
    /**
     * Adds members to an existing group
     *
     * @summary Add members to a group
     */
    addMembersToGroup(body: types.AddMembersToGroupBodyParam): Promise<FetchResponse<200, types.AddMembersToGroupResponse200>>;
    /**
     * Get wallet balance for Org
     *
     * @summary Get wallet balance
     */
    getWalletBalanaceForOrg(): Promise<FetchResponse<200, types.GetWalletBalanaceForOrgResponse200>>;
    /**
     * Get Team members with their Reporting Managers
     *
     * @summary Get Team
     * @throws FetchError<401, types.GetTeamResponse401> Unauthorized
     */
    getTeam(): Promise<FetchResponse<200, types.GetTeamResponse200>>;
    /**
     * Change reporting manager of the user
     *
     * @summary Change reporting manager
     * @throws FetchError<400, types.ChangeReportingManagerResponse400> Incorrect payload
     * @throws FetchError<401, types.ChangeReportingManagerResponse401> Unauthorized
     * @throws FetchError<422, types.ChangeReportingManagerResponse422> One or more user does not exist.
     */
    changeReportingManager(body: types.ChangeReportingManagerBodyParam): Promise<FetchResponse<200, types.ChangeReportingManagerResponse200>>;
    /**
     * Remove team member from team
     *
     * @summary Remove team member
     * @throws FetchError<400, types.RemoveTeamMemberResponse400> Incorrect payload
     * @throws FetchError<401, types.RemoveTeamMemberResponse401> Unauthorized
     * @throws FetchError<422, types.RemoveTeamMemberResponse422> User not found
     */
    removeTeamMember(body: types.RemoveTeamMemberBodyParam): Promise<FetchResponse<200, types.RemoveTeamMemberResponse200>>;
    /**
     * Add member under reporting manager
     *
     * @summary Add member under reporting manager
     * @throws FetchError<400, types.AddMemberUnderReportingManagerResponse400> Incorrect payload
     * @throws FetchError<401, types.AddMemberUnderReportingManagerResponse401> Unauthorized
     * @throws FetchError<422, types.AddMemberUnderReportingManagerResponse422> Reporting manager does not exist.
     */
    addMemberUnderReportingManager(body: types.AddMemberUnderReportingManagerBodyParam): Promise<FetchResponse<200, types.AddMemberUnderReportingManagerResponse200>>;
    /**
     * Get detailed information about a specific team member including their role, reporting
     * managers, and organization details
     *
     * @summary Get Team Member Details
     * @throws FetchError<400, types.GetTeamMemberDetailsResponse400> Invalid request parameters
     * @throws FetchError<401, types.GetTeamMemberDetailsResponse401> Unauthorized
     * @throws FetchError<404, types.GetTeamMemberDetailsResponse404> Team member not found
     * @throws FetchError<422, types.GetTeamMemberDetailsResponse422> Unprocessable Entity
     */
    getTeamMemberDetails(metadata: types.GetTeamMemberDetailsMetadataParam): Promise<FetchResponse<200, types.GetTeamMemberDetailsResponse200>>;
    /**
     * Get all roles
     *
     * @summary Get all roles
     * @throws FetchError<401, types.GetAllRolesResponse401> Unauthorized
     * @throws FetchError<422, types.GetAllRolesResponse422> Roles not found
     */
    getAllRoles(): Promise<FetchResponse<200, types.GetAllRolesResponse200>>;
    /**
     * Upload Media to use in messages
     *
     * @summary Upload Media
     * @throws FetchError<401, types.UploadMediaResponse401> Unauthorized
     * @throws FetchError<402, types.UploadMediaResponse402> File Size Exceeds max file size.
     * @throws FetchError<403, types.UploadMediaResponse403> File Type not supported.
     */
    uploadMedia(body?: types.UploadMediaBodyParam): Promise<FetchResponse<201, types.UploadMediaResponse201>>;
    /**
     * Register New Webhook
     *
     * @summary Register New Webhook
     * @throws FetchError<400, types.RegisterWebhookResponse400> Incorrect payload
     * @throws FetchError<401, types.RegisterWebhookResponse401> Unauthorized
     */
    registerWebhook(body: types.RegisterWebhookBodyParam): Promise<FetchResponse<201, types.RegisterWebhookResponse201>>;
    /**
     * Get Webhooks
     *
     * @summary Get Webhooks
     * @throws FetchError<400, types.GetWebhooksResponse400> Incorrect payload
     * @throws FetchError<401, types.GetWebhooksResponse401> Unauthorized
     */
    getWebhooks(metadata?: types.GetWebhooksMetadataParam): Promise<FetchResponse<201, types.GetWebhooksResponse201>>;
    /**
     * Delete Webhooks
     *
     * @summary Delete Webhooks
     * @throws FetchError<400, types.DeleteWebhooksResponse400> Incorrect payload
     * @throws FetchError<401, types.DeleteWebhooksResponse401> Unauthorized
     */
    deleteWebhooks(body: types.DeleteWebhooksBodyParam): Promise<FetchResponse<201, types.DeleteWebhooksResponse201>>;
    /**
     * Edit Webhooks
     *
     * @summary Edit Webhooks
     * @throws FetchError<400, types.EditWebhooksResponse400> Incorrect payload
     * @throws FetchError<401, types.EditWebhooksResponse401> Unauthorized
     */
    editWebhooks(body: types.EditWebhooksBodyParam, metadata: types.EditWebhooksMetadataParam): Promise<FetchResponse<201, types.EditWebhooksResponse201>>;
    /**
     * Assign team member to customer
     *
     * @summary Assign team member to customer
     * @throws FetchError<400, types.AssignTeamMemberToCustomerResponse400> Incorrect payload
     * @throws FetchError<401, types.AssignTeamMemberToCustomerResponse401> Unauthorized
     * @throws FetchError<403, types.AssignTeamMemberToCustomerResponse403> Access forbidden
     * @throws FetchError<404, types.AssignTeamMemberToCustomerResponse404> Resource not found
     * @throws FetchError<422, types.AssignTeamMemberToCustomerResponse422> Unprocessable Entity
     */
    assignTeamMemberToCustomer(body: types.AssignTeamMemberToCustomerBodyParam): Promise<FetchResponse<number, unknown>>;
    /**
     * Get chat window status for a customer with given WABA number
     *
     * @summary Get chat window status
     * @throws FetchError<400, types.GetChatWindowStatusResponse400> Incorrect payload
     * @throws FetchError<401, types.GetChatWindowStatusResponse401> Unauthorized
     * @throws FetchError<404, types.GetChatWindowStatusResponse404> Chat or WABA number not found
     */
    getChatWindowStatus(metadata: types.GetChatWindowStatusMetadataParam): Promise<FetchResponse<200, types.GetChatWindowStatusResponse200>>;
}
declare const createSDK: SDK;
export = createSDK;
