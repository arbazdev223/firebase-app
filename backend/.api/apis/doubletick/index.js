"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var oas_1 = __importDefault(require("oas"));
var core_1 = __importDefault(require("api/dist/core"));
var openapi_json_1 = __importDefault(require("./openapi.json"));
var SDK = /** @class */ (function () {
    function SDK() {
        this.spec = oas_1.default.init(openapi_json_1.default);
        this.core = new core_1.default(this.spec, 'doubletick/2.0 (api/6.1.3)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    SDK.prototype.config = function (config) {
        this.core.setConfig(config);
    };
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
    SDK.prototype.auth = function () {
        var _a;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        (_a = this.core).setAuth.apply(_a, values);
        return this;
    };
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
    SDK.prototype.server = function (url, variables) {
        if (variables === void 0) { variables = {}; }
        this.core.setServer(url, variables);
    };
    /**
     * Send Whatsapp Template Message
     *
     * @summary Send Whatsapp Template Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappTemplateResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappTemplateResponse401> Unauthorized
     */
    SDK.prototype.outgoingMessagesWhatsappTemplate = function (body) {
        return this.core.fetch('/whatsapp/message/template', 'post', body);
    };
    /**
     * Send Whatsapp Text Message
     *
     * @summary Send Whatsapp Text Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappTextResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappTextResponse401> Unauthorized
     */
    SDK.prototype.outgoingMessagesWhatsappText = function (body) {
        return this.core.fetch('/whatsapp/message/text', 'post', body);
    };
    /**
     * Export Chats For a WabaNumber
     *
     * @summary Export Chats For a Customer For Given WabaNumber
     * @throws FetchError<400, types.ExportChatsToExcelResponse400> Incorrect payload
     * @throws FetchError<401, types.ExportChatsToExcelResponse401> Unauthorized
     */
    SDK.prototype.exportChatsToExcel = function (body) {
        return this.core.fetch('/export-chats', 'post', body);
    };
    /**
     * Retrieve chat messages sent by the specified WhatsApp Business Account (WABA) number,
     * with optional date filtering.
     *
     * @summary Get chat messages for a customer of WABA number
     * @throws FetchError<400, types.GetChatMessagesResponse400> Incorrect payload
     * @throws FetchError<401, types.GetChatMessagesResponse401> Unauthorized
     */
    SDK.prototype.getChatMessages = function (metadata) {
        return this.core.fetch('/chat-messages', 'get', metadata);
    };
    /**
     * Send Whatsapp Video Message
     *
     * @summary Send Whatsapp Video Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappVideoResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappVideoResponse401> Unauthorized
     */
    SDK.prototype.outgoingMessagesWhatsappVideo = function (body) {
        return this.core.fetch('/whatsapp/message/video', 'post', body);
    };
    /**
     * Send Whatsapp Audio Message
     *
     * @summary Send Whatsapp Audio Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappAudioResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappAudioResponse401> Unauthorized
     */
    SDK.prototype.outgoingMessagesWhatsappAudio = function (body) {
        return this.core.fetch('/whatsapp/message/audio', 'post', body);
    };
    /**
     * Send Whatsapp Image Message
     *
     * @summary Send Whatsapp Image Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappImageResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappImageResponse401> Unauthorized
     */
    SDK.prototype.outgoingMessagesWhatsappImage = function (body) {
        return this.core.fetch('/whatsapp/message/image', 'post', body);
    };
    /**
     * Send Whatsapp Document Message
     *
     * @summary Send Whatsapp Document Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappDocumentResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappDocumentResponse401> Unauthorized
     */
    SDK.prototype.outgoingMessagesWhatsappDocument = function (body) {
        return this.core.fetch('/whatsapp/message/document', 'post', body);
    };
    /**
     * Send Whatsapp Location Message
     *
     * @summary Send Whatsapp Location Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappLocationResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappLocationResponse401> Unauthorized
     */
    SDK.prototype.outgoingMessagesWhatsappLocation = function (body) {
        return this.core.fetch('/whatsapp/message/location', 'post', body);
    };
    /**
     * Send Whatsapp Interactive Button Message
     *
     * @summary Send Whatsapp Interactive Button Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappInteractiveResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappInteractiveResponse401> Unauthorized
     */
    SDK.prototype.outgoingMessagesWhatsappInteractive = function (body) {
        return this.core.fetch('/whatsapp/message/interactive', 'post', body);
    };
    /**
     * Send Whatsapp Interactive List Message
     *
     * @summary Send Whatsapp Interactive List Message
     * @throws FetchError<400, types.OutgoingMessagesWhatsappInteractiveListResponse400> Incorrect payload
     * @throws FetchError<401, types.OutgoingMessagesWhatsappInteractiveListResponse401> Unauthorized
     */
    SDK.prototype.outgoingMessagesWhatsappInteractiveList = function (body) {
        return this.core.fetch('/whatsapp/message/interactive-list', 'post', body);
    };
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
    SDK.prototype.sendBroadcastMessage = function (body) {
        return this.core.fetch('/whatsapp/message/broadcast', 'post', body);
    };
    /**
     * Create New Template
     *
     * @summary Create New Template
     * @throws FetchError<400, types.CreateTemplateResponse400> Incorrect payload
     * @throws FetchError<401, types.CreateTemplateResponse401> Unauthorized
     */
    SDK.prototype.createTemplate = function (body) {
        return this.core.fetch('/template', 'post', body);
    };
    /**
     * Delete Template
     *
     * @summary Delete Template
     * @throws FetchError<400, types.DeleteTemplateResponse400> Incorrect payload
     * @throws FetchError<401, types.DeleteTemplateResponse401> Unauthorized
     */
    SDK.prototype.deleteTemplate = function (body) {
        return this.core.fetch('/template', 'delete', body);
    };
    /**
     * Edit Template
     *
     * @summary Edit Template
     * @throws FetchError<400, types.EditTemplateResponse400> Incorrect payload
     * @throws FetchError<401, types.EditTemplateResponse401> Unauthorized
     */
    SDK.prototype.editTemplate = function (body, metadata) {
        return this.core.fetch('/template/{templateId}', 'patch', body, metadata);
    };
    /**
     * Get Templates
     *
     * @summary Get Templates
     * @throws FetchError<400, types.GetTemplatesResponse400> Incorrect payload
     * @throws FetchError<401, types.GetTemplatesResponse401> Unauthorized
     */
    SDK.prototype.getTemplates = function (metadata) {
        return this.core.fetch('/v2/templates', 'get', metadata);
    };
    /**
     * Get details of customer along with custom fields
     *
     * @summary Get customer details
     * @throws FetchError<400, types.GetCustomerDetailsResponse400> Incorrect payload
     * @throws FetchError<401, types.GetCustomerDetailsResponse401> Unauthorized
     * @throws FetchError<404, types.GetCustomerDetailsResponse404> NotFound
     */
    SDK.prototype.getCustomerDetails = function (metadata) {
        return this.core.fetch('/customer/details', 'get', metadata);
    };
    /**
     * Assign Custom Fields and/or Tags to Customer
     *
     * @summary Assign Custom Fields and/or Tags to Customer
     * @throws FetchError<400, types.CustomerAssignTagsCustomFieldsResponse400> Incorrect payload
     * @throws FetchError<401, types.CustomerAssignTagsCustomFieldsResponse401> Unauthorized
     */
    SDK.prototype.customerAssignTagsCustomFields = function (body) {
        return this.core.fetch('/customer/assign-tags-custom-fields', 'post', body);
    };
    /**
     * Remove Custom Fields and/or Tags from Customer
     *
     * @summary Remove Custom Fields and/or Tags from Customer
     * @throws FetchError<400, types.CustomerRemoveTagsCustomFieldsResponse400> Incorrect payload
     * @throws FetchError<401, types.CustomerRemoveTagsCustomFieldsResponse401> Unauthorized
     */
    SDK.prototype.customerRemoveTagsCustomFields = function (body) {
        return this.core.fetch('/customer/remove-tags-custom-fields', 'post', body);
    };
    /**
     * Block customer using phone number
     *
     * @summary Block a customer
     * @throws FetchError<400, types.BlockUnblockCustomerResponse400> Incorrect payload
     * @throws FetchError<401, types.BlockUnblockCustomerResponse401> Unauthorized
     * @throws FetchError<404, types.BlockUnblockCustomerResponse404> NotFound
     */
    SDK.prototype.blockUnblockCustomer = function (body) {
        return this.core.fetch('/customer/block', 'post', body);
    };
    /**
     * Unblock customer using phone number
     *
     * @summary Unblock a customer
     * @throws FetchError<400, types.UnblockUnblockCustomerResponse400> Incorrect payload
     * @throws FetchError<401, types.UnblockUnblockCustomerResponse401> Unauthorized
     * @throws FetchError<404, types.UnblockUnblockCustomerResponse404> NotFound
     */
    SDK.prototype.unblockUnblockCustomer = function (body) {
        return this.core.fetch('/customer/unblock', 'post', body);
    };
    /**
     * Assign team member to chat
     *
     * @summary Assign team member to chat
     * @throws FetchError<400, types.AssignTeamMemberToChatResponse400> Incorrect payload
     * @throws FetchError<401, types.AssignTeamMemberToChatResponse401> Unauthorized
     * @throws FetchError<422, types.AssignTeamMemberToChatResponse422> User is not a member of the team
     */
    SDK.prototype.assignTeamMemberToChat = function (body) {
        return this.core.fetch('/team-member/assign', 'post', body);
    };
    /**
     * Unassign team member from a chat
     *
     * @summary Unssign team member from a chat
     * @throws FetchError<400, types.UnassignTeamMemberFromChatResponse400> Incorrect payload
     * @throws FetchError<401, types.UnassignTeamMemberFromChatResponse401> Unauthorized
     * @throws FetchError<422, types.UnassignTeamMemberFromChatResponse422> User is not a member of the team
     */
    SDK.prototype.unassignTeamMemberFromChat = function (body) {
        return this.core.fetch('/team-member/unassign', 'post', body);
    };
    /**
     * Logout a team member
     *
     * @summary Logout a team member
     * @throws FetchError<400, types.LogoutTeamMemberResponse400> Incorrect payload
     * @throws FetchError<401, types.LogoutTeamMemberResponse401> Unauthorized
     * @throws FetchError<422, types.LogoutTeamMemberResponse422> User is not a member of the team
     */
    SDK.prototype.logoutTeamMember = function (body) {
        return this.core.fetch('/team-member/logout', 'post', body);
    };
    /**
     * Check reverted on time
     *
     * @summary Check reverted on time
     * @throws FetchError<400, types.CheckRevertedOnTimeResponse400> Incorrect payload
     * @throws FetchError<401, types.CheckRevertedOnTimeResponse401> Unauthorized
     */
    SDK.prototype.checkRevertedOnTime = function (body) {
        return this.core.fetch('/customer/check-reverted-on-time', 'get', body);
    };
    /**
     * Create a new group
     *
     * @summary Create a new group
     */
    SDK.prototype.createGroup = function (body) {
        return this.core.fetch('/groups', 'post', body);
    };
    /**
     * Deletes multiple groups
     *
     * @summary Delete groups
     */
    SDK.prototype.deleteGroups = function (body) {
        return this.core.fetch('/groups', 'delete', body);
    };
    /**
     * Returns a list of paginated groups based on search criteria and pagination parameters
     *
     * @summary Get paginated groups
     */
    SDK.prototype.getPaginatedGroupsV2 = function (metadata) {
        return this.core.fetch('/groups', 'get', metadata);
    };
    /**
     * Adds members to an existing group
     *
     * @summary Add members to a group
     */
    SDK.prototype.addMembersToGroup = function (body) {
        return this.core.fetch('/groups/add-members', 'post', body);
    };
    /**
     * Get wallet balance for Org
     *
     * @summary Get wallet balance
     */
    SDK.prototype.getWalletBalanaceForOrg = function () {
        return this.core.fetch('/wallet/balance', 'get');
    };
    /**
     * Get Team members with their Reporting Managers
     *
     * @summary Get Team
     * @throws FetchError<401, types.GetTeamResponse401> Unauthorized
     */
    SDK.prototype.getTeam = function () {
        return this.core.fetch('/team', 'get');
    };
    /**
     * Change reporting manager of the user
     *
     * @summary Change reporting manager
     * @throws FetchError<400, types.ChangeReportingManagerResponse400> Incorrect payload
     * @throws FetchError<401, types.ChangeReportingManagerResponse401> Unauthorized
     * @throws FetchError<422, types.ChangeReportingManagerResponse422> One or more user does not exist.
     */
    SDK.prototype.changeReportingManager = function (body) {
        return this.core.fetch('/team-member/reporting-manager', 'patch', body);
    };
    /**
     * Remove team member from team
     *
     * @summary Remove team member
     * @throws FetchError<400, types.RemoveTeamMemberResponse400> Incorrect payload
     * @throws FetchError<401, types.RemoveTeamMemberResponse401> Unauthorized
     * @throws FetchError<422, types.RemoveTeamMemberResponse422> User not found
     */
    SDK.prototype.removeTeamMember = function (body) {
        return this.core.fetch('/team-member', 'delete', body);
    };
    /**
     * Add member under reporting manager
     *
     * @summary Add member under reporting manager
     * @throws FetchError<400, types.AddMemberUnderReportingManagerResponse400> Incorrect payload
     * @throws FetchError<401, types.AddMemberUnderReportingManagerResponse401> Unauthorized
     * @throws FetchError<422, types.AddMemberUnderReportingManagerResponse422> Reporting manager does not exist.
     */
    SDK.prototype.addMemberUnderReportingManager = function (body) {
        return this.core.fetch('/team/members', 'post', body);
    };
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
    SDK.prototype.getTeamMemberDetails = function (metadata) {
        return this.core.fetch('/team/member', 'get', metadata);
    };
    /**
     * Get all roles
     *
     * @summary Get all roles
     * @throws FetchError<401, types.GetAllRolesResponse401> Unauthorized
     * @throws FetchError<422, types.GetAllRolesResponse422> Roles not found
     */
    SDK.prototype.getAllRoles = function () {
        return this.core.fetch('/roles', 'get');
    };
    /**
     * Upload Media to use in messages
     *
     * @summary Upload Media
     * @throws FetchError<401, types.UploadMediaResponse401> Unauthorized
     * @throws FetchError<402, types.UploadMediaResponse402> File Size Exceeds max file size.
     * @throws FetchError<403, types.UploadMediaResponse403> File Type not supported.
     */
    SDK.prototype.uploadMedia = function (body) {
        return this.core.fetch('/media/upload', 'post', body);
    };
    /**
     * Register New Webhook
     *
     * @summary Register New Webhook
     * @throws FetchError<400, types.RegisterWebhookResponse400> Incorrect payload
     * @throws FetchError<401, types.RegisterWebhookResponse401> Unauthorized
     */
    SDK.prototype.registerWebhook = function (body) {
        return this.core.fetch('/v2/webhook/register', 'post', body);
    };
    /**
     * Get Webhooks
     *
     * @summary Get Webhooks
     * @throws FetchError<400, types.GetWebhooksResponse400> Incorrect payload
     * @throws FetchError<401, types.GetWebhooksResponse401> Unauthorized
     */
    SDK.prototype.getWebhooks = function (metadata) {
        return this.core.fetch('/v2/webhooks', 'get', metadata);
    };
    /**
     * Delete Webhooks
     *
     * @summary Delete Webhooks
     * @throws FetchError<400, types.DeleteWebhooksResponse400> Incorrect payload
     * @throws FetchError<401, types.DeleteWebhooksResponse401> Unauthorized
     */
    SDK.prototype.deleteWebhooks = function (body) {
        return this.core.fetch('/v2/webhook/deregister', 'delete', body);
    };
    /**
     * Edit Webhooks
     *
     * @summary Edit Webhooks
     * @throws FetchError<400, types.EditWebhooksResponse400> Incorrect payload
     * @throws FetchError<401, types.EditWebhooksResponse401> Unauthorized
     */
    SDK.prototype.editWebhooks = function (body, metadata) {
        return this.core.fetch('/v2/webhook/{webhookId}', 'post', body, metadata);
    };
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
    SDK.prototype.assignTeamMemberToCustomer = function (body) {
        return this.core.fetch('/customer/assign', 'post', body);
    };
    /**
     * Get chat window status for a customer with given WABA number
     *
     * @summary Get chat window status
     * @throws FetchError<400, types.GetChatWindowStatusResponse400> Incorrect payload
     * @throws FetchError<401, types.GetChatWindowStatusResponse401> Unauthorized
     * @throws FetchError<404, types.GetChatWindowStatusResponse404> Chat or WABA number not found
     */
    SDK.prototype.getChatWindowStatus = function (metadata) {
        return this.core.fetch('/chat/status', 'get', metadata);
    };
    return SDK;
}());
var createSDK = (function () { return new SDK(); })();
module.exports = createSDK;
