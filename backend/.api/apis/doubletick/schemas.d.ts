declare const AddMemberUnderReportingManager: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly reportingManagerPhoneNumber: {
                readonly type: "string";
                readonly minLength: 1;
            };
            readonly members: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly minLength: 1;
                        };
                        readonly phone: {
                            readonly type: "string";
                            readonly minLength: 1;
                        };
                        readonly orgRoleId: {
                            readonly type: "string";
                            readonly minLength: 1;
                        };
                        readonly wabaAccess: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly wabaNumber: {
                                        readonly type: "string";
                                        readonly minLength: 1;
                                    };
                                    readonly wabaRoleId: {
                                        readonly type: "string";
                                        readonly minLength: 1;
                                    };
                                };
                            };
                        };
                        readonly addToTeamDirectly: {
                            readonly type: "boolean";
                        };
                        readonly sendInviteMessage: {
                            readonly type: "boolean";
                        };
                    };
                };
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly description: "Indicates whether the operation was successful";
                };
            };
            readonly required: readonly ["success"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [422];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Reporting manager does not exist."];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const AddMembersToGroup: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly groupId: {
                readonly type: "string";
                readonly description: "The ID of the group to add members to";
                readonly examples: readonly ["group_usPBFQXZtY"];
            };
            readonly members: {
                readonly type: "array";
                readonly description: "List of members to add";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "The name of the member";
                            readonly examples: readonly ["Name"];
                        };
                        readonly phone: {
                            readonly type: "string";
                            readonly description: "The phone number of the member";
                            readonly examples: readonly ["919999999999"];
                        };
                    };
                    readonly required: readonly ["phone"];
                };
            };
        };
        readonly required: readonly ["groupId", "members"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly invalidMembers: {
                    readonly type: "array";
                    readonly description: "List of members that could not be added";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly name: {
                                readonly type: "string";
                                readonly description: "The name of the member";
                                readonly examples: readonly ["Name"];
                            };
                            readonly phone: {
                                readonly type: "string";
                                readonly description: "The phone number of the member";
                                readonly examples: readonly ["919999999999"];
                            };
                        };
                        readonly required: readonly ["phone"];
                    };
                };
                readonly createdMembers: {
                    readonly type: "array";
                    readonly description: "List of members that were successfully added";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["919999999999", "919999999998"];
                    };
                };
                readonly membersAlreadyPresent: {
                    readonly type: "array";
                    readonly description: "List of phone numbers of members that were already in the group";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["919999999999", "919999999998"];
                    };
                };
                readonly groupId: {
                    readonly type: "string";
                    readonly description: "The ID of the group that members were added to";
                    readonly examples: readonly ["group_inpkqRL8G2"];
                };
            };
            readonly required: readonly ["invalidMembers", "createdMembers", "membersAlreadyPresent", "groupId"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const AssignTeamMemberToChat: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly customerPhoneNumber: {
                readonly description: "Phone number of customer";
                readonly type: "string";
                readonly minLength: 7;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["917838849957"];
            };
            readonly assignedUserPhoneNumber: {
                readonly description: "Phone number of customer";
                readonly type: "string";
                readonly minLength: 7;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["917838849957"];
            };
            readonly reassign: {
                readonly description: "Boolean to assign user even if chat is already assigned";
                readonly type: "boolean";
                readonly format: "boolean";
                readonly examples: readonly ["true"];
            };
            readonly wabaNumber: {
                readonly type: "string";
                readonly description: "Integration Waba Number with country code";
                readonly minLength: 7;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["919876543210"];
            };
        };
        readonly required: readonly ["customerPhoneNumber", "assignedUserPhoneNumber"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["phoneNumber must be a string"];
                    };
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Invalid public api key"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [422];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["User is not a member of the team"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const AssignTeamMemberToCustomer: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly customerPhoneNumber: {
                readonly description: "Phone number of customer";
                readonly type: "string";
                readonly minLength: 7;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["917838849957"];
            };
            readonly assignedUserPhoneNumber: {
                readonly description: "Phone number of user";
                readonly type: "string";
                readonly minLength: 7;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["917838849957"];
            };
            readonly wabaNumber: {
                readonly type: "string";
                readonly description: "Integration Waba Number with country code";
                readonly minLength: 7;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["919876543210"];
            };
        };
        readonly required: readonly ["customerPhoneNumber", "assignedUserPhoneNumber", "wabaNumber"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["phoneNumber must be a string"];
                    };
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Invalid public api key"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [403];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Team member +1234567890 does not have access to WhatsApp API Number +9876543210"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Forbidden"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [404];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["wabaNumber not found"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Not Found"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [422];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["User is not a member of the team"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unprocessable Entity"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const BlockUnblockCustomer: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly phone: {
                readonly type: "string";
                readonly description: "The phone number of customer which block operation will be performed";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
        };
        readonly required: readonly ["phone"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["phone must be a string"];
                    };
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Not Found"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [404];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Invalid Customer"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const ChangeReportingManager: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly reportingManagerPhoneNumber: {
                readonly type: "string";
                readonly description: "Phone number of the reporting manager";
            };
            readonly memberPhoneNumber: {
                readonly type: "string";
                readonly description: "Phone number of the member";
            };
        };
        readonly required: readonly ["reportingManagerPhoneNumber", "memberPhoneNumber"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly description: "Indicates whether the operation was successful";
                };
            };
            readonly required: readonly ["success"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [422];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["One or more user does not exist."];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CheckRevertedOnTime: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly phoneNumber: {
                readonly description: "Phone number of customer";
                readonly type: "string";
                readonly minLength: 7;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly waitingForResponseInSec: {
                readonly description: "Wait time for response in seconds.";
                readonly type: "number";
                readonly examples: readonly [60];
            };
            readonly defaultAgentName: {
                readonly description: "Default name for the agent";
                readonly type: "string";
                readonly examples: readonly ["abc"];
            };
            readonly defaultAgentNumber: {
                readonly description: "Default number of the agent";
                readonly type: "string";
                readonly minLength: 7;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly wabaNumber: {
                readonly description: "Waba Number";
                readonly type: "string";
                readonly minLength: 7;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly agentName: {
                    readonly type: "string";
                    readonly examples: readonly ["abc"];
                };
                readonly agentPhoneNumber: {
                    readonly type: "string";
                    readonly examples: readonly ["+919999999999"];
                };
                readonly revertedOnTime: {
                    readonly type: "boolean";
                    readonly examples: readonly [false];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["phoneNumber must be a string"];
                    };
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Invalid public api key"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateGroup: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly name: {
                readonly type: "string";
                readonly description: "The name of the group";
                readonly examples: readonly ["Test Group"];
            };
            readonly members: {
                readonly type: "array";
                readonly description: "List of members in the group";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "The name of the member";
                            readonly examples: readonly ["Name"];
                        };
                        readonly phone: {
                            readonly type: "string";
                            readonly description: "The phone number of the member";
                            readonly examples: readonly ["919999999999"];
                        };
                    };
                    readonly required: readonly ["phone"];
                };
            };
        };
        readonly required: readonly ["name"];
        readonly additionalProperties: false;
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly groupData: {
                    readonly type: "object";
                    readonly properties: {
                        readonly groupId: {
                            readonly type: "string";
                            readonly description: "The ID of the newly created group";
                            readonly examples: readonly ["group_CG0wH3AIQw"];
                        };
                        readonly memberCount: {
                            readonly type: "integer";
                            readonly description: "The number of members in the group";
                            readonly examples: readonly [1];
                        };
                        readonly groupChatName: {
                            readonly type: "string";
                            readonly description: "The name of the created group";
                            readonly examples: readonly ["Test Group"];
                        };
                    };
                    readonly required: readonly ["groupId", "memberCount", "groupChatName"];
                };
                readonly invalidMembers: {
                    readonly type: "array";
                    readonly description: "List of invalid members (if any)";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly name: {
                                readonly type: "string";
                                readonly description: "The name of the member";
                                readonly examples: readonly ["Name"];
                            };
                            readonly phone: {
                                readonly type: "string";
                                readonly description: "The phone number of the member";
                                readonly examples: readonly ["919999999999"];
                            };
                        };
                        readonly required: readonly ["phone"];
                    };
                };
            };
            readonly required: readonly ["groupData", "invalidMembers"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CreateTemplate: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly name: {
                readonly type: "string";
                readonly description: "Template Name";
                readonly minLength: 1;
                readonly maxLength: 512;
            };
            readonly language: {
                readonly type: "string";
                readonly enum: readonly ["af", "sq", "ar", "az", "bn", "bg", "ca", "zh_CN", "zh_HK", "zh_TW", "hr", "cs", "da", "nl", "en", "en_GB", "en_US", "et", "fil", "fi", "fr", "ka", "de", "el", "gu", "ha", "he", "hi", "hu", "id", "ga", "it", "ja", "kn", "kk", "rw_RW", "ko", "ky_KG", "lo", "lv", "lt", "mk", "ms", "ml", "mr", "nb", "fa", "pl", "pt_BR", "pt_PT", "pa", "ro", "ru", "sr", "sk", "sl", "es", "es_AR", "es_ES", "es_MX", "sw", "sv", "ta", "te", "th", "tr", "uk", "ur", "uz"];
                readonly description: "Template Language";
                readonly examples: readonly ["en"];
            };
            readonly components: {
                readonly description: "Template Components";
                readonly type: "object";
                readonly required: readonly ["body"];
                readonly properties: {
                    readonly header: {
                        readonly description: "Header Component";
                        readonly type: "object";
                        readonly required: readonly ["format"];
                        readonly properties: {
                            readonly format: {
                                readonly type: "string";
                                readonly description: "Header Format";
                                readonly enum: readonly ["TEXT", "IMAGE", "VIDEO", "DOCUMENT"];
                            };
                            readonly text: {
                                readonly type: "string";
                                readonly description: "Header Text (Present only if format is TEXT)";
                                readonly maxLength: 60;
                            };
                            readonly example: {
                                readonly description: "Header Example (add link only if format is Media type or add variable and their values if format is TEXT and text contains variable)";
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly type: "string";
                                };
                                readonly properties: {
                                    readonly link: {
                                        readonly type: "string";
                                        readonly description: "Header Example Media Url (Present only if format is IMAGE/VIDEO/DOCUMENT)";
                                    };
                                };
                            };
                        };
                    };
                    readonly body: {
                        readonly description: "Body Component";
                        readonly type: "object";
                        readonly required: readonly ["text"];
                        readonly properties: {
                            readonly text: {
                                readonly type: "string";
                                readonly description: "Body Text";
                                readonly maxLength: 1024;
                            };
                            readonly example: {
                                readonly type: "object";
                                readonly description: "Body Variable Example (Present only if text contains variable)";
                                readonly additionalProperties: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                    readonly footer: {
                        readonly description: "Footer Component";
                        readonly type: "object";
                        readonly required: readonly ["text"];
                        readonly properties: {
                            readonly text: {
                                readonly type: "string";
                                readonly description: "Footer Text";
                                readonly maxLength: 60;
                            };
                        };
                    };
                    readonly buttons: {
                        readonly description: "Buttons Component";
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly required: readonly ["type", "text"];
                            readonly properties: {
                                readonly type: {
                                    readonly type: "string";
                                    readonly description: "Button Type";
                                    readonly enum: readonly ["QUICK_REPLY", "URL", "PHONE_NUMBER"];
                                };
                                readonly text: {
                                    readonly type: "string";
                                    readonly description: "Button Text";
                                    readonly maxLength: 25;
                                    readonly minLength: 1;
                                };
                                readonly url: {
                                    readonly type: "string";
                                    readonly description: "Button Url (Present only if type is URL)";
                                };
                                readonly example: {
                                    readonly type: "string";
                                    readonly description: "Button Url Example Parameter (Present only if type is URL and url contains variable)";
                                };
                                readonly phoneNumber: {
                                    readonly type: "string";
                                    readonly description: "Button Phone Number (Present only if type is PHONE_NUMBER)";
                                };
                            };
                        };
                    };
                };
            };
            readonly category: {
                readonly type: "string";
                readonly enum: readonly ["MARKETING", "UTILITY"];
                readonly description: "Template Category";
                readonly examples: readonly ["MARKETING"];
            };
            readonly wabaNumbers: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                    readonly description: "The phone number from which the message is sent, with the country code";
                    readonly minLength: 10;
                    readonly maxLength: 15;
                    readonly format: "phone";
                    readonly examples: readonly ["+919999999999"];
                };
            };
            readonly allowCategoryUpdate: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Set to true to allow Meta to automatically assign a category. If omitted, the template may be rejected due to miscategorization.";
            };
        };
        readonly required: readonly ["name", "language", "components", "category"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly examples: readonly [true];
                };
            };
            readonly required: readonly ["success"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CustomerAssignTagsCustomFields: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly phone: {
                readonly type: "string";
                readonly description: "Customer Phone Number with country code. Example, 919876543210";
                readonly examples: readonly ["919876543210"];
            };
            readonly tags: {
                readonly description: "Array of tags to be assigned";
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly examples: readonly ["tag1", "tag2"];
            };
            readonly customFields: {
                readonly description: "Array of custom fields to be assigned";
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "custom field name";
                            readonly examples: readonly ["field name"];
                        };
                        readonly value: {
                            readonly type: "string";
                            readonly description: "custom field value";
                            readonly examples: readonly ["value"];
                        };
                    };
                    readonly required: readonly ["name", "value"];
                };
            };
            readonly name: {
                readonly type: "string";
                readonly description: "Customer Name";
                readonly examples: readonly ["John Doe"];
            };
            readonly optIn: {
                readonly type: "boolean";
                readonly description: "Opt in status of the customer";
                readonly examples: readonly [true];
            };
            readonly agentPhone: {
                readonly type: "string";
                readonly description: "Agent Phone Number with country code (null if unassigned)";
                readonly examples: readonly ["919876543210"];
            };
            readonly wabaNumber: {
                readonly type: "string";
                readonly description: "Integration Waba Number with country code";
                readonly examples: readonly ["919876543210"];
            };
        };
        readonly required: readonly ["phone"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly tags: {
                    readonly description: "tags response";
                    readonly type: "object";
                    readonly required: readonly ["added", "errored"];
                    readonly properties: {
                        readonly added: {
                            readonly description: "Array of tags added";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly examples: readonly ["tag name"];
                            };
                        };
                        readonly errored: {
                            readonly description: "Array of tags errored";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly required: readonly ["tag", "error"];
                                readonly properties: {
                                    readonly tag: {
                                        readonly type: "string";
                                        readonly description: "tag name";
                                        readonly examples: readonly ["tag name 2"];
                                    };
                                    readonly error: {
                                        readonly type: "string";
                                        readonly description: "error message";
                                        readonly examples: readonly ["error message"];
                                    };
                                };
                            };
                        };
                    };
                };
                readonly customFields: {
                    readonly description: "custom fields response";
                    readonly type: "object";
                    readonly required: readonly ["added", "errored"];
                    readonly properties: {
                        readonly added: {
                            readonly description: "Array of custom fields added";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly examples: readonly ["custom field name"];
                            };
                        };
                        readonly errored: {
                            readonly description: "Array of custom fields errored";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly required: readonly ["customField", "error"];
                                readonly properties: {
                                    readonly customField: {
                                        readonly type: "string";
                                        readonly description: "custom field name";
                                        readonly examples: readonly ["custom field name 2"];
                                    };
                                    readonly error: {
                                        readonly type: "string";
                                        readonly description: "error message";
                                        readonly examples: readonly ["error message"];
                                    };
                                };
                            };
                        };
                    };
                };
                readonly customerId: {
                    readonly type: "string";
                    readonly description: "Customer ID";
                    readonly examples: readonly ["customer_n9mfidizLv"];
                };
            };
            readonly required: readonly ["tags", "customFields"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CustomerRemoveTagsCustomFields: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly phone: {
                readonly type: "string";
                readonly description: "customer phone number";
            };
            readonly tags: {
                readonly description: "Array of tags to be removed";
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly examples: readonly ["tag1", "tag2"];
            };
            readonly customFields: {
                readonly description: "Array of customFields to be removed";
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly examples: readonly ["custom field 1", "custom field 2"];
            };
            readonly wabaNumber: {
                readonly type: "string";
                readonly description: "Integration Waba Number with country code";
                readonly examples: readonly ["919876543210"];
            };
        };
        readonly required: readonly ["phone", "tags", "customFields"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly tags: {
                    readonly description: "tags response";
                    readonly type: "object";
                    readonly required: readonly ["added", "errored"];
                    readonly properties: {
                        readonly added: {
                            readonly description: "Array of tags added";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly errored: {
                            readonly description: "Array of tags errored";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly required: readonly ["tag", "error"];
                                readonly properties: {
                                    readonly tag: {
                                        readonly type: "string";
                                        readonly description: "tag name";
                                        readonly examples: readonly ["tag name 2"];
                                    };
                                    readonly error: {
                                        readonly type: "string";
                                        readonly description: "error message";
                                        readonly examples: readonly ["error message"];
                                    };
                                };
                            };
                        };
                    };
                };
                readonly customFields: {
                    readonly description: "custom fields response";
                    readonly type: "object";
                    readonly required: readonly ["added", "errored"];
                    readonly properties: {
                        readonly added: {
                            readonly description: "Array of custom fields added";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly errored: {
                            readonly description: "Array of custom fields errored";
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly required: readonly ["customField", "error"];
                                readonly properties: {
                                    readonly customField: {
                                        readonly type: "string";
                                        readonly description: "custom field name";
                                        readonly examples: readonly ["custom field name 2"];
                                    };
                                    readonly error: {
                                        readonly type: "string";
                                        readonly description: "error message";
                                        readonly examples: readonly ["error message"];
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly required: readonly ["tags", "customFields"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const DeleteGroups: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly groupIds: {
                readonly type: "array";
                readonly description: "The IDs of the group to delete";
                readonly items: {
                    readonly type: "string";
                    readonly examples: readonly ["group_usPBFQXZtY", "group_CG0wH3AIQw"];
                };
                readonly minItems: 1;
                readonly uniqueItems: true;
                readonly examples: readonly ["group_usPBFQXZtY", "group_CG0wH3AIQw"];
            };
        };
        readonly required: readonly ["groupIds"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
};
declare const DeleteTemplate: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly name: {
                readonly type: "string";
                readonly description: "Template Name";
                readonly examples: readonly ["template_name"];
            };
            readonly wabaPhoneNumber: {
                readonly type: "string";
                readonly description: "Waba Number";
                readonly examples: readonly ["14155238886"];
            };
        };
        readonly required: readonly ["name", "wabaNumber"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly examples: readonly [true];
                };
            };
            readonly required: readonly ["success"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const DeleteWebhooks: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly webhookId: {
                readonly type: "string";
                readonly description: "The unique identifier of the webhook to be deregistered";
            };
        };
        readonly required: readonly ["webhookId"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {};
            readonly description: "Empty response body indicating successful creation";
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const EditTemplate: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly name: {
                readonly type: "string";
                readonly description: "Template Name";
                readonly minLength: 1;
                readonly maxLength: 512;
            };
            readonly language: {
                readonly type: "string";
                readonly enum: readonly ["af", "sq", "ar", "az", "bn", "bg", "ca", "zh_CN", "zh_HK", "zh_TW", "hr", "cs", "da", "nl", "en", "en_GB", "en_US", "et", "fil", "fi", "fr", "ka", "de", "el", "gu", "ha", "he", "hi", "hu", "id", "ga", "it", "ja", "kn", "kk", "rw_RW", "ko", "ky_KG", "lo", "lv", "lt", "mk", "ms", "ml", "mr", "nb", "fa", "pl", "pt_BR", "pt_PT", "pa", "ro", "ru", "sr", "sk", "sl", "es", "es_AR", "es_ES", "es_MX", "sw", "sv", "ta", "te", "th", "tr", "uk", "ur", "uz"];
                readonly description: "Template Language";
                readonly examples: readonly ["en"];
            };
            readonly components: {
                readonly description: "Template Components";
                readonly type: "object";
                readonly required: readonly ["body"];
                readonly properties: {
                    readonly header: {
                        readonly description: "Header Component";
                        readonly type: "object";
                        readonly required: readonly ["format"];
                        readonly properties: {
                            readonly format: {
                                readonly type: "string";
                                readonly description: "Header Format";
                                readonly enum: readonly ["TEXT", "IMAGE", "VIDEO", "DOCUMENT"];
                            };
                            readonly text: {
                                readonly type: "string";
                                readonly description: "Header Text (Present only if format is TEXT)";
                                readonly maxLength: 60;
                            };
                            readonly example: {
                                readonly description: "Header Example (add link only if format is Media type or add variable and their values if format is TEXT and text contains variable)";
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly type: "string";
                                };
                                readonly properties: {
                                    readonly link: {
                                        readonly type: "string";
                                        readonly description: "Header Example Media Url (Present only if format is IMAGE/VIDEO/DOCUMENT)";
                                    };
                                };
                            };
                        };
                    };
                    readonly body: {
                        readonly description: "Body Component";
                        readonly type: "object";
                        readonly required: readonly ["text"];
                        readonly properties: {
                            readonly text: {
                                readonly type: "string";
                                readonly description: "Body Text";
                                readonly maxLength: 1024;
                            };
                            readonly example: {
                                readonly type: "object";
                                readonly description: "Body Variable Example (Present only if text contains variable)";
                                readonly additionalProperties: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                    readonly footer: {
                        readonly description: "Footer Component";
                        readonly type: "object";
                        readonly required: readonly ["text"];
                        readonly properties: {
                            readonly text: {
                                readonly type: "string";
                                readonly description: "Footer Text";
                                readonly maxLength: 60;
                            };
                        };
                    };
                    readonly buttons: {
                        readonly description: "Buttons Component";
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly required: readonly ["type", "text"];
                            readonly properties: {
                                readonly type: {
                                    readonly type: "string";
                                    readonly description: "Button Type";
                                    readonly enum: readonly ["QUICK_REPLY", "URL", "PHONE_NUMBER"];
                                };
                                readonly text: {
                                    readonly type: "string";
                                    readonly description: "Button Text";
                                    readonly maxLength: 25;
                                    readonly minLength: 1;
                                };
                                readonly url: {
                                    readonly type: "string";
                                    readonly description: "Button Url (Present only if type is URL)";
                                };
                                readonly example: {
                                    readonly type: "string";
                                    readonly description: "Button Url Example Parameter (Present only if type is URL and url contains variable)";
                                };
                                readonly phoneNumber: {
                                    readonly type: "string";
                                    readonly description: "Button Phone Number (Present only if type is PHONE_NUMBER)";
                                };
                            };
                        };
                    };
                };
            };
            readonly category: {
                readonly type: "string";
                readonly enum: readonly ["MARKETING", "UTILITY"];
                readonly description: "Template Category";
                readonly examples: readonly ["MARKETING"];
            };
            readonly wabaNumbers: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                    readonly description: "The phone number from which the message is sent, with the country code";
                    readonly minLength: 10;
                    readonly maxLength: 15;
                    readonly format: "phone";
                    readonly examples: readonly ["+919999999999"];
                };
            };
            readonly allowCategoryUpdate: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Set to true to allow Meta to automatically assign a category. If omitted, the template may be rejected due to miscategorization.";
            };
        };
        readonly required: readonly ["name", "language", "components", "category"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly templateId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The template ID";
                };
            };
            readonly required: readonly ["templateId"];
        }];
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly examples: readonly [true];
                };
            };
            readonly required: readonly ["success"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const EditWebhooks: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly url: {
                readonly type: "string";
                readonly format: "uri";
                readonly description: "URL of the webhook";
                readonly examples: readonly ["https://example.com/webhook"];
            };
            readonly method: {
                readonly type: "string";
                readonly description: "HTTP method used for the webhook";
                readonly enum: readonly ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"];
                readonly examples: readonly ["POST"];
            };
            readonly headers: {
                readonly type: "object";
                readonly description: "Custom headers to be sent with the webhook";
                readonly additionalProperties: true;
            };
            readonly body: {
                readonly type: "object";
                readonly description: "Payload to be sent with the webhook";
                readonly additionalProperties: true;
            };
            readonly query: {
                readonly type: "object";
                readonly description: "Query parameters to be included in the webhook URL";
                readonly additionalProperties: true;
            };
            readonly bodyFormat: {
                readonly type: "string";
                readonly description: "Format of the body content";
                readonly enum: readonly ["JSON", "FORM_DATA"];
                readonly examples: readonly ["JSON"];
            };
            readonly authorization: {
                readonly type: "object";
                readonly description: "Authorization details for the webhook";
                readonly properties: {
                    readonly type: {
                        readonly type: "string";
                        readonly description: "The type of authorization used for the webhook";
                        readonly enum: readonly ["BASIC", "BEARER"];
                        readonly examples: readonly ["BEARER"];
                    };
                    readonly payload: {
                        readonly type: "string";
                        readonly description: "The authorization payload, such as a token or credentials";
                        readonly examples: readonly ["some-secure-token"];
                    };
                };
                readonly required: readonly ["type", "payload"];
            };
            readonly webhookEvents: {
                readonly type: "array";
                readonly description: "Events that trigger the webhook";
                readonly items: {
                    readonly type: "string";
                    readonly enum: readonly ["MESSAGE_RECEIVED", "MESSAGE_STATUS_UPDATE", "CHAT_ASSIGNED_TO_AGENT", "CHAT_UNASSIGNED", "UPDATE_CUSTOMER_CUSTOM_FIELD", "WIDGET_LEAD_RECEIVED", "VERIFIED_WIDGET_LEAD_RECEIVED", "NEW_LEAD", "RAW_CLOUD_API_WEBHOOK", "CLOSE_CONVERSATION", "TEMPLATE_UPDATE", "ADD_TAG", "REMOVE_TAG", "CALL_TO_WHATSAPP_MESSAGE_RECEIVED", "CONVERSATION_OPENED", "CUSTOMER_BUSINESS_CHAT_OPEN"];
                };
                readonly examples: readonly ["MESSAGE_RECEIVED", "CLOSE_CONVERSATION"];
            };
            readonly retryOnTimeout: {
                readonly type: "boolean";
                readonly description: "Retry the webhook call on timeout";
            };
            readonly name: {
                readonly type: "string";
                readonly description: "Name of the webhook";
            };
            readonly wabaNumbers: {
                readonly type: "array";
                readonly description: "List of WABA numbers associated with the webhook";
                readonly items: {
                    readonly type: "string";
                    readonly minLength: 10;
                    readonly maxLength: 15;
                    readonly format: "phone";
                    readonly examples: readonly ["+919999999999"];
                };
            };
        };
        readonly required: readonly ["url", "method", "webhookEvents", "name", "wabaNumbers"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly webhookId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The webhook ID";
                };
            };
            readonly required: readonly ["webhookId"];
        }];
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly validWebhooks: {
                    readonly type: "array";
                    readonly description: "A list of valid webhooks";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly wabaNumber: {
                                readonly type: "string";
                                readonly description: "The WABA (WhatsApp Business Account) number associated with the webhook";
                                readonly examples: readonly ["+919999999999"];
                            };
                            readonly webhookEventType: {
                                readonly type: "string";
                                readonly description: "The type of event that triggers the webhook\n\n`MESSAGE_RECEIVED` `MESSAGE_STATUS_UPDATE` `CHAT_ASSIGNED_TO_AGENT` `CHAT_UNASSIGNED` `UPDATE_CUSTOMER_CUSTOM_FIELD` `WIDGET_LEAD_RECEIVED` `VERIFIED_WIDGET_LEAD_RECEIVED` `NEW_LEAD` `RAW_CLOUD_API_WEBHOOK` `CLOSE_CONVERSATION` `TEMPLATE_UPDATE` `ADD_TAG` `REMOVE_TAG` `CALL_TO_WHATSAPP_MESSAGE_RECEIVED` `CONVERSATION_OPENED` `CUSTOMER_BUSINESS_CHAT_OPEN`";
                                readonly enum: readonly ["MESSAGE_RECEIVED", "MESSAGE_STATUS_UPDATE", "CHAT_ASSIGNED_TO_AGENT", "CHAT_UNASSIGNED", "UPDATE_CUSTOMER_CUSTOM_FIELD", "WIDGET_LEAD_RECEIVED", "VERIFIED_WIDGET_LEAD_RECEIVED", "NEW_LEAD", "RAW_CLOUD_API_WEBHOOK", "CLOSE_CONVERSATION", "TEMPLATE_UPDATE", "ADD_TAG", "REMOVE_TAG", "CALL_TO_WHATSAPP_MESSAGE_RECEIVED", "CONVERSATION_OPENED", "CUSTOMER_BUSINESS_CHAT_OPEN"];
                                readonly examples: readonly ["MESSAGE_RECEIVED"];
                            };
                        };
                        readonly required: readonly ["wabaNumber", "webhookEventType"];
                    };
                };
                readonly invalidWebhooks: {
                    readonly type: "array";
                    readonly description: "A list of invalid webhooks";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly wabaNumber: {
                                readonly type: "string";
                                readonly description: "The WABA (WhatsApp Business Account) number associated with the webhook";
                                readonly examples: readonly ["+919999999999"];
                            };
                            readonly webhookEventType: {
                                readonly type: "string";
                                readonly description: "The type of event that triggers the webhook\n\n`MESSAGE_RECEIVED` `MESSAGE_STATUS_UPDATE` `CHAT_ASSIGNED_TO_AGENT` `CHAT_UNASSIGNED` `UPDATE_CUSTOMER_CUSTOM_FIELD` `WIDGET_LEAD_RECEIVED` `VERIFIED_WIDGET_LEAD_RECEIVED` `NEW_LEAD` `RAW_CLOUD_API_WEBHOOK` `CLOSE_CONVERSATION` `TEMPLATE_UPDATE` `ADD_TAG` `REMOVE_TAG` `CALL_TO_WHATSAPP_MESSAGE_RECEIVED` `CONVERSATION_OPENED` `CUSTOMER_BUSINESS_CHAT_OPEN`";
                                readonly enum: readonly ["MESSAGE_RECEIVED", "MESSAGE_STATUS_UPDATE", "CHAT_ASSIGNED_TO_AGENT", "CHAT_UNASSIGNED", "UPDATE_CUSTOMER_CUSTOM_FIELD", "WIDGET_LEAD_RECEIVED", "VERIFIED_WIDGET_LEAD_RECEIVED", "NEW_LEAD", "RAW_CLOUD_API_WEBHOOK", "CLOSE_CONVERSATION", "TEMPLATE_UPDATE", "ADD_TAG", "REMOVE_TAG", "CALL_TO_WHATSAPP_MESSAGE_RECEIVED", "CONVERSATION_OPENED", "CUSTOMER_BUSINESS_CHAT_OPEN"];
                                readonly examples: readonly ["MESSAGE_RECEIVED"];
                            };
                        };
                        readonly required: readonly ["wabaNumber", "webhookEventType"];
                    };
                };
                readonly invalidWabaNumbers: {
                    readonly type: "array";
                    readonly description: "A list of invalid WABA numbers";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["+918888888880"];
                    };
                };
            };
            readonly required: readonly ["validWebhooks", "invalidWebhooks", "invalidWabaNumbers"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const ExportChatsToExcel: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly customerPhoneNumber: {
                readonly type: "string";
                readonly description: "The phone number of customer";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["919999999999"];
            };
            readonly wabaNumber: {
                readonly type: "string";
                readonly description: "The wabaNumber of integration for which you want to export chats";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["919999999999"];
            };
            readonly startDate: {
                readonly type: "string";
                readonly description: "The starting date from which chat messages will be exported. This date should be formatted as 'DD-MM-YYYY'.";
                readonly examples: readonly ["14-05-2024"];
            };
            readonly endDate: {
                readonly type: "string";
                readonly description: "The ending date up to which chat messages will be exported. This date should also be formatted as 'DD-MM-YYYY'.";
                readonly examples: readonly ["20-05-2024"];
            };
            readonly includeMedia: {
                readonly type: "boolean";
                readonly description: "If true then it will include shared media link";
                readonly examples: readonly [true];
            };
        };
        readonly required: readonly ["customerPhoneNumber", "wabaNumber", "startDate", "endDate", "includeMedia"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly examples: readonly ["true"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetAllRoles: {
    readonly response: {
        readonly "200": {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                    };
                    readonly name: {
                        readonly type: "string";
                    };
                    readonly description: {
                        readonly type: "string";
                    };
                    readonly type: {
                        readonly type: "string";
                        readonly enum: readonly ["ORG", "WHATSAPP"];
                        readonly description: "`ORG` `WHATSAPP`";
                    };
                    readonly permissions: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly id: {
                                    readonly type: "string";
                                };
                                readonly name: {
                                    readonly type: "string";
                                };
                                readonly description: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                    readonly isCustomRole: {
                        readonly type: "boolean";
                    };
                    readonly dateCreated: {
                        readonly type: "string";
                        readonly format: "date-time";
                    };
                    readonly dateUpdated: {
                        readonly type: "string";
                        readonly format: "date-time";
                    };
                };
                readonly required: readonly ["roleId", "roleName", "description", "type", "permissions", "isCustomRole", "dateCreated", "dateUpdated"];
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [422];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Roles not found"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetChatMessages: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly wabaNumber: {
                    readonly type: "string";
                    readonly examples: readonly ["11234567890"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The WhatsApp Business Account (WABA) number";
                };
                readonly customerNumber: {
                    readonly type: "string";
                    readonly examples: readonly ["911234567890"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Customer's phone number";
                };
                readonly startDate: {
                    readonly type: "string";
                    readonly examples: readonly ["01-01-2024"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The start date for the chat messages (DD-MM-YYYY)";
                };
                readonly endDate: {
                    readonly type: "string";
                    readonly examples: readonly ["31-12-2024"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The end date for the chat messages (DD-MM-YYYY)";
                };
            };
            readonly required: readonly ["wabaNumber", "customerNumber"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly examples: readonly [true];
                };
                readonly messages: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly messageId: {
                                readonly type: "string";
                                readonly examples: readonly ["1234567890"];
                            };
                            readonly sender: {
                                readonly type: "string";
                                readonly examples: readonly ["19876543210"];
                            };
                            readonly recipient: {
                                readonly type: "string";
                                readonly examples: readonly ["919876543210"];
                            };
                            readonly message: {
                                readonly type: "string";
                                readonly examples: readonly ["Hello, how can I help you?"];
                            };
                            readonly mediaUrl: {
                                readonly type: "string";
                                readonly examples: readonly ["https://example.com/media/abc.jpg"];
                            };
                            readonly timestamp: {
                                readonly type: "string";
                                readonly format: "date-time";
                                readonly examples: readonly ["2024-01-01T10:00:00Z"];
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly examples: readonly ["delivered"];
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Invalid public api key"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetChatWindowStatus: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly customerPhoneNumber: {
                    readonly type: "string";
                    readonly examples: readonly ["+919999999999"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The customer's phone number";
                };
                readonly wabaNumber: {
                    readonly type: "string";
                    readonly examples: readonly ["+919999999998"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The WhatsApp Business Account (WABA) number";
                };
            };
            readonly required: readonly ["customerPhoneNumber", "wabaNumber"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly customerPhoneNumber: {
                    readonly type: "string";
                    readonly examples: readonly ["+919999999999"];
                };
                readonly wabaNumber: {
                    readonly type: "string";
                    readonly examples: readonly ["+919999999998"];
                };
                readonly isOpen: {
                    readonly type: "boolean";
                    readonly examples: readonly [true];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [404];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Chat or waba number not found"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Not Found"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetCustomerDetails: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly phoneNumber: {
                    readonly type: "string";
                    readonly examples: readonly ["917838849957"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly customerId: {
                    readonly type: "string";
                    readonly examples: readonly ["customer_xxxxxxxxxx"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly customer: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                            readonly examples: readonly ["customer_abcde12345"];
                        };
                        readonly name: {
                            readonly type: "string";
                            readonly examples: readonly ["customername1"];
                        };
                        readonly phone: {
                            readonly type: "string";
                            readonly examples: readonly ["+919999999999"];
                        };
                        readonly customFields: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly id: {
                                        readonly type: "string";
                                        readonly examples: readonly [""];
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly value: {
                                        readonly type: "string";
                                    };
                                    readonly "type ": {
                                        readonly type: "string";
                                    };
                                };
                            };
                        };
                        readonly assignedToUser: {
                            readonly type: "string";
                        };
                        readonly assignedUserNumber: {
                            readonly type: "string";
                        };
                    };
                };
            };
            readonly required: readonly ["phone"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["phoneNumber must be a string"];
                    };
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Not Found"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [404];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["NotFound"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetPaginatedGroupsV2: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly searchQuery: {
                    readonly type: "string";
                    readonly description: "The search query to filter groups";
                    readonly examples: readonly ["group name"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly orderBy: {
                    readonly type: "string";
                    readonly description: "The field to order the groups by";
                    readonly enum: readonly ["NAME", "DATE_CREATED"];
                    readonly examples: readonly ["NAME"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly format: {
                    readonly type: "string";
                    readonly description: "The order format to apply to the groups";
                    readonly enum: readonly ["ASCENDING", "DESCENDING", "ascending", "descending"];
                    readonly examples: readonly ["ASCENDING"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly afterGroupId: {
                    readonly type: "string";
                    readonly description: "The group ID to fetch the groups after";
                    readonly examples: readonly ["group_id"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly afterGroupName: {
                    readonly type: "string";
                    readonly description: "The group name to fetch the groups after";
                    readonly examples: readonly ["group_name"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly afterDateCreated: {
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly description: "The group creation date to fetch the groups after";
                    readonly examples: readonly ["2020-01-01T00:00:00.000Z"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly groups: {
                    readonly description: "Array of groups";
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly groupId: {
                                readonly type: "string";
                                readonly description: "Group ID";
                                readonly examples: readonly ["group_id"];
                            };
                            readonly groupChatId: {
                                readonly type: "string";
                                readonly description: "Group Chat ID";
                                readonly examples: readonly ["group_chat_id"];
                            };
                            readonly groupChatName: {
                                readonly type: "string";
                                readonly description: "Group chat name";
                                readonly examples: readonly ["group_name"];
                            };
                            readonly memberCount: {
                                readonly type: "string";
                                readonly description: "Total members in the group";
                                readonly examples: readonly [10];
                            };
                            readonly canManageGroupAccess: {
                                readonly type: "boolean";
                                readonly description: "Boolean to check if the user can manage group access";
                                readonly examples: readonly [true];
                            };
                            readonly groupAccessLevel: {
                                readonly type: "string";
                                readonly description: "The level of access the user has to the group\n\n`FULL_ACCESS` `SEND_ONLY_ACCESS` `NO_ACCESS`";
                                readonly enum: readonly ["FULL_ACCESS", "SEND_ONLY_ACCESS", "NO_ACCESS"];
                                readonly examples: readonly ["NO_ACCESS"];
                            };
                        };
                    };
                };
                readonly paginationParams: {
                    readonly description: "Pagination parameters";
                    readonly type: "object";
                    readonly properties: {
                        readonly afterGroupId: {
                            readonly type: "string";
                            readonly description: "Group ID after which the groups are to be fetched";
                            readonly examples: readonly ["group_id"];
                        };
                        readonly afterGroupName: {
                            readonly type: "string";
                            readonly description: "Group name after which the groups are to be fetched";
                            readonly examples: readonly ["group_name"];
                        };
                        readonly afterDateCreated: {
                            readonly type: "string";
                            readonly description: "Group date created after which the groups are to be fetched";
                            readonly examples: readonly ["2020-01-01T00:00:00.000Z"];
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetTeam: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly data: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                                readonly description: "ID of the Team member";
                            };
                            readonly name: {
                                readonly type: "string";
                                readonly description: "Name of the Team member";
                            };
                            readonly phone: {
                                readonly type: "string";
                                readonly description: "Phone number of the Team member";
                            };
                            readonly email: {
                                readonly type: "string";
                                readonly description: "Email of the Team member";
                            };
                            readonly joinDate: {
                                readonly type: "string";
                                readonly format: "date-time";
                                readonly description: "Date when Team member joined";
                            };
                            readonly reportingManager: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                            readonly description: "ID of the Reporting Manager";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                            readonly description: "Name of the Reporting Manager";
                                        };
                                        readonly phone: {
                                            readonly type: "string";
                                            readonly description: "Phone number of the Reporting Manager";
                                        };
                                        readonly email: {
                                            readonly type: "string";
                                            readonly description: "Email of the Reporting Manager";
                                        };
                                        readonly joinDate: {
                                            readonly type: "string";
                                            readonly format: "date-time";
                                            readonly description: "Date when Reporting Manager joined";
                                        };
                                    };
                                };
                            };
                            readonly orgRoleName: {
                                readonly type: "string";
                                readonly description: "Name of the Organization Role";
                            };
                            readonly orgRoleId: {
                                readonly type: "string";
                                readonly description: "ID of the Organization Role";
                            };
                            readonly isOrganizationOwner: {
                                readonly type: "boolean";
                                readonly description: "Indicates whether the Team member is the owner of the Organization";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetTeamMemberDetails: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly agentNumber: {
                    readonly type: "string";
                    readonly examples: readonly ["919999999999"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Phone number of the team member/agent to get details for";
                };
            };
            readonly required: readonly ["agentNumber"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly description: "Unique identifier of the team member";
                };
                readonly name: {
                    readonly type: "string";
                    readonly description: "Name of the team member";
                };
                readonly phone: {
                    readonly type: "string";
                    readonly description: "Phone number of the team member";
                };
                readonly email: {
                    readonly type: "string";
                    readonly description: "Email address of the team member";
                };
                readonly joinDate: {
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly description: "Date when the team member joined";
                };
                readonly reportingManager: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                                readonly description: "Unique identifier of the reporting manager";
                            };
                            readonly name: {
                                readonly type: "string";
                                readonly description: "Name of the reporting manager";
                            };
                            readonly phone: {
                                readonly type: "string";
                                readonly description: "Phone number of the reporting manager";
                            };
                            readonly email: {
                                readonly type: "string";
                                readonly description: "Email of the reporting manager (optional)";
                            };
                            readonly joinDate: {
                                readonly type: "string";
                                readonly format: "date-time";
                                readonly description: "Date when the reporting manager joined";
                            };
                        };
                    };
                };
                readonly orgRoleName: {
                    readonly type: "string";
                    readonly description: "Name of the team member's role in the organization";
                };
                readonly orgRoleId: {
                    readonly type: "string";
                    readonly description: "ID of the team member's role in the organization";
                };
                readonly isOrganizationOwner: {
                    readonly type: "boolean";
                    readonly description: "Whether the team member is the owner of the organization";
                };
                readonly wabaRoles: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly wabaName: {
                                readonly type: "string";
                                readonly description: "Name of the WhatsApp Business Account";
                            };
                            readonly wabaNumber: {
                                readonly type: "string";
                                readonly description: "WhatsApp Business Account Number";
                            };
                            readonly roleName: {
                                readonly type: "string";
                                readonly description: "Name of the role assigned for this WABA";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["agentNumber must be a valid phone number"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [404];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Team member not found"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Not Found"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [422];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Invalid phone number:"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unprocessable Entity"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetTemplates: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly status: {
                    readonly type: "string";
                    readonly description: "Template status";
                    readonly enum: readonly ["APPROVED", "REJECTED", "PENDING", "PAUSED", "ALL"];
                    readonly examples: readonly ["PENDING"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly name: {
                    readonly type: "string";
                    readonly description: "Template name";
                    readonly examples: readonly ["test_template"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly language: {
                    readonly type: "string";
                    readonly description: "Template language";
                    readonly enum: readonly ["af", "sq", "ar", "az", "bn", "bg", "ca", "zh_CN", "zh_HK", "zh_TW", "hr", "cs", "da", "nl", "en", "en_GB", "en_US", "et", "fil", "fi", "fr", "ka", "de", "el", "gu", "ha", "he", "hi", "hu", "id", "ga", "it", "ja", "kn", "kk", "rw_RW", "ko", "ky_KG", "lo", "lv", "lt", "mk", "ms", "ml", "mr", "nb", "fa", "pl", "pt_BR", "pt_PT", "pa", "ro", "ru", "sr", "sk", "sl", "es", "es_AR", "es_ES", "es_MX", "sw", "sv", "ta", "te", "th", "tr", "uk", "ur", "uz"];
                    readonly examples: readonly ["en"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly category: {
                    readonly type: "string";
                    readonly description: "Template category";
                    readonly enum: readonly ["MARKETING", "UTILITY"];
                    readonly examples: readonly ["MARKETING"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly wabaPhoneNumbers: {
                    readonly type: "string";
                    readonly description: "Waba Phone Numbers";
                    readonly examples: readonly ["919999999999,918888888888"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly allWabaPhoneNumbers: {
                    readonly type: "boolean";
                    readonly description: "If set to true, returns templates for all Waba Phone Numbers";
                    readonly examples: readonly [true];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "201": {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "number";
                        readonly description: "Template ID";
                    };
                    readonly name: {
                        readonly type: "string";
                        readonly description: "Template Name";
                        readonly minLength: 1;
                        readonly maxLength: 512;
                    };
                    readonly language: {
                        readonly type: "string";
                        readonly enum: readonly ["af", "sq", "ar", "az", "bn", "bg", "ca", "zh_CN", "zh_HK", "zh_TW", "hr", "cs", "da", "nl", "en", "en_GB", "en_US", "et", "fil", "fi", "fr", "ka", "de", "el", "gu", "ha", "he", "hi", "hu", "id", "ga", "it", "ja", "kn", "kk", "rw_RW", "ko", "ky_KG", "lo", "lv", "lt", "mk", "ms", "ml", "mr", "nb", "fa", "pl", "pt_BR", "pt_PT", "pa", "ro", "ru", "sr", "sk", "sl", "es", "es_AR", "es_ES", "es_MX", "sw", "sv", "ta", "te", "th", "tr", "uk", "ur", "uz"];
                        readonly description: "Template Language\n\n`af` `sq` `ar` `az` `bn` `bg` `ca` `zh_CN` `zh_HK` `zh_TW` `hr` `cs` `da` `nl` `en` `en_GB` `en_US` `et` `fil` `fi` `fr` `ka` `de` `el` `gu` `ha` `he` `hi` `hu` `id` `ga` `it` `ja` `kn` `kk` `rw_RW` `ko` `ky_KG` `lo` `lv` `lt` `mk` `ms` `ml` `mr` `nb` `fa` `pl` `pt_BR` `pt_PT` `pa` `ro` `ru` `sr` `sk` `sl` `es` `es_AR` `es_ES` `es_MX` `sw` `sv` `ta` `te` `th` `tr` `uk` `ur` `uz`";
                        readonly examples: readonly ["en"];
                    };
                    readonly category: {
                        readonly type: "string";
                        readonly enum: readonly ["MARKETING", "UTILITY"];
                        readonly description: "Template Category\n\n`MARKETING` `UTILITY`";
                        readonly examples: readonly ["MARKETING"];
                    };
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["APPROVED", "REJECTED", "PENDING", "PAUSED"];
                        readonly description: "Template Status\n\n`APPROVED` `REJECTED` `PENDING` `PAUSED`";
                        readonly examples: readonly ["PAUSED"];
                    };
                    readonly rejectedReason: {
                        readonly type: "string";
                        readonly description: "Template Rejected Reason";
                        readonly examples: readonly ["Template Rejected Reason"];
                    };
                    readonly createdBy: {
                        readonly type: "string";
                        readonly description: "Template Created By";
                        readonly examples: readonly ["Creater_Name"];
                    };
                    readonly wabaPhoneNumber: {
                        readonly type: "string";
                        readonly description: "Waba Phone Number";
                        readonly examples: readonly ["14155238886"];
                    };
                    readonly components: {
                        readonly description: "Template Components";
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly type: {
                                    readonly type: "string";
                                    readonly enum: readonly ["BODY", "HEADER", "FOOTER", "BUTTON"];
                                    readonly description: "Component Type\n\n`BODY` `HEADER` `FOOTER` `BUTTON`";
                                    readonly examples: readonly ["HEADER"];
                                };
                                readonly format: {
                                    readonly type: "string";
                                    readonly enum: readonly ["TEXT", "IMAGE", "DOCUMENT", "VIDEO", "LOCATION"];
                                    readonly description: "Template Component Format (Present when type is HEADER)\n\n`TEXT` `IMAGE` `DOCUMENT` `VIDEO` `LOCATION`";
                                    readonly examples: readonly ["TEXT"];
                                };
                                readonly text: {
                                    readonly type: "string";
                                    readonly description: "Present WHEN type is BODY/FOOTER or type is HEADER and format is TEXT";
                                };
                                readonly variables: {
                                    readonly description: "Present when type is HEADER/BODY";
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly name: {
                                                readonly type: "string";
                                                readonly description: "Name of the variable present in the text";
                                                readonly examples: readonly ["variable_1"];
                                            };
                                            readonly mediaUrl: {
                                                readonly type: "string";
                                                readonly description: "Present only if type is IMAGE/VIDEO/DOCUMENT";
                                                readonly examples: readonly ["https://placeholder.com/150"];
                                            };
                                            readonly fileName: {
                                                readonly type: "string";
                                                readonly description: "The filename of the document (Present only if type is DOCUMENT)";
                                                readonly examples: readonly ["Example File Name"];
                                            };
                                        };
                                    };
                                };
                                readonly buttons: {
                                    readonly description: "Present when type is BUTTON";
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                                readonly description: "Button Type\n\n`QUICK_REPLY` `URL` `PHONE_NUMBER`";
                                                readonly enum: readonly ["QUICK_REPLY", "URL", "PHONE_NUMBER"];
                                                readonly examples: readonly ["URL"];
                                            };
                                            readonly text: {
                                                readonly type: "string";
                                                readonly description: "Button Text";
                                                readonly examples: readonly ["Button Text"];
                                            };
                                            readonly url: {
                                                readonly type: "string";
                                                readonly description: "Button Url (Present only if type is URL)";
                                            };
                                            readonly phoneNumber: {
                                                readonly type: "string";
                                                readonly description: "Button Phone Number (Present only if type is PHONE_NUMBER)";
                                            };
                                            readonly variables: {
                                                readonly description: "Button Variables (Present when type is URL)";
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly parameter: {
                                                            readonly type: "string";
                                                            readonly examples: readonly ["some-url-path"];
                                                        };
                                                    };
                                                    readonly required: readonly ["parameter"];
                                                };
                                            };
                                        };
                                        readonly required: readonly ["text", "type"];
                                    };
                                };
                            };
                            readonly required: readonly ["type"];
                        };
                    };
                };
                readonly required: readonly ["id", "name", "language", "category", "components", "status", "rejectedReason", "createdBy", "wabaPhoneNumber"];
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetWalletBalanaceForOrg: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly currencyCode: {
                    readonly type: "string";
                    readonly description: "Currency code";
                    readonly examples: readonly ["INR"];
                };
                readonly balance: {
                    readonly type: "number";
                    readonly description: "The wallet balance";
                    readonly examples: readonly ["3000"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetWebhooks: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly sortBy: {
                    readonly type: "string";
                    readonly description: "Sort by";
                    readonly enum: readonly ["name", "url", "createdBy", "integrationCount"];
                    readonly examples: readonly ["name"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly sortDirection: {
                    readonly type: "string";
                    readonly description: "Sort direction";
                    readonly enum: readonly ["ASC", "DESC"];
                    readonly examples: readonly ["DESC"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly webhookId: {
                    readonly type: "string";
                    readonly description: "The unique identifier of the webhook";
                    readonly examples: readonly ["abc123"];
                };
                readonly url: {
                    readonly type: "string";
                    readonly format: "uri";
                    readonly description: "The URL of the webhook";
                    readonly examples: readonly ["https://example.com/webhook"];
                };
                readonly eventTypes: {
                    readonly type: "array";
                    readonly description: "A list of event types that the webhook listens to";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["MESSAGE_RECEIVED"];
                    };
                    readonly examples: readonly ["MESSAGE_RECEIVED", "MESSAGE_SENT"];
                };
                readonly wabaNumbers: {
                    readonly type: "array";
                    readonly description: "A list of WABA Numbers associated with the webhook";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["+919999999999"];
                    };
                    readonly examples: readonly ["+919999999999", "+918888888888"];
                };
                readonly integrationCount: {
                    readonly type: "integer";
                    readonly description: "The count of integrations associated with the webhook";
                    readonly examples: readonly [2];
                };
                readonly createdBy: {
                    readonly type: "string";
                    readonly description: "The user who created the webhook";
                    readonly examples: readonly ["admin"];
                };
                readonly name: {
                    readonly type: "string";
                    readonly description: "The name of the webhook";
                    readonly examples: readonly ["My Webhook"];
                };
            };
            readonly required: readonly ["webhookId", "url", "eventTypes", "wabaNumbers", "integrationCount", "createdBy", "name"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const LogoutTeamMember: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly userPhoneNumber: {
                readonly description: "Phone number of the User";
                readonly type: "string";
                readonly minLength: 7;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["919999999999"];
            };
        };
        readonly required: readonly ["userPhoneNumber"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly examples: readonly ["true"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["userPhoneNumber must be a string"];
                    };
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Invalid public api key"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [422];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["User is not a member of the team"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const OutgoingMessagesWhatsappAudio: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly from: {
                readonly type: "string";
                readonly description: "The phone number from which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly to: {
                readonly type: "string";
                readonly description: "The phone number to which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly messageId: {
                readonly type: "string";
                readonly description: "Message ID (UUID v4) to be used for the message. If not provided, a random UUID v4 will be generated";
                readonly minLength: 36;
                readonly maxLength: 36;
                readonly examples: readonly ["uuid-v4"];
            };
            readonly content: {
                readonly description: "Audio message to be sent";
                readonly type: "object";
                readonly required: readonly ["mediaUrl"];
                readonly properties: {
                    readonly mediaUrl: {
                        readonly type: "string";
                        readonly description: "URL of the media to be sent";
                        readonly minLength: 1;
                        readonly maxLength: 2048;
                        readonly examples: readonly ["https://example.com/image.jpg"];
                    };
                    readonly caption: {
                        readonly type: "string";
                        readonly description: "Caption for the media";
                        readonly minLength: 1;
                        readonly maxLength: 3000;
                        readonly examples: readonly ["This is a caption"];
                    };
                };
            };
        };
        readonly required: readonly ["to", "content"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const OutgoingMessagesWhatsappDocument: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly from: {
                readonly type: "string";
                readonly description: "The phone number from which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly to: {
                readonly type: "string";
                readonly description: "The phone number to which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly messageId: {
                readonly type: "string";
                readonly description: "Message ID (UUID v4) to be used for the message. If not provided, a random UUID v4 will be generated";
                readonly minLength: 36;
                readonly maxLength: 36;
                readonly examples: readonly ["uuid-v4"];
            };
            readonly content: {
                readonly description: "Document message to be sent";
                readonly type: "object";
                readonly required: readonly ["mediaUrl"];
                readonly properties: {
                    readonly mediaUrl: {
                        readonly type: "string";
                        readonly description: "URL of the media to be sent";
                        readonly minLength: 1;
                        readonly maxLength: 2048;
                        readonly examples: readonly ["https://example.com/image.jpg"];
                    };
                    readonly caption: {
                        readonly type: "string";
                        readonly description: "Caption for the media";
                        readonly minLength: 1;
                        readonly maxLength: 3000;
                        readonly examples: readonly ["This is a caption"];
                    };
                    readonly filename: {
                        readonly type: "string";
                        readonly description: "The filename of the document";
                        readonly examples: readonly ["Example File Name"];
                    };
                };
            };
        };
        readonly required: readonly ["to", "content"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const OutgoingMessagesWhatsappImage: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly from: {
                readonly type: "string";
                readonly description: "The phone number from which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly to: {
                readonly type: "string";
                readonly description: "The phone number to which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly messageId: {
                readonly type: "string";
                readonly description: "Message ID (UUID v4) to be used for the message. If not provided, a random UUID v4 will be generated";
                readonly minLength: 36;
                readonly maxLength: 36;
                readonly examples: readonly ["uuid-v4"];
            };
            readonly content: {
                readonly description: "Image message to be sent";
                readonly type: "object";
                readonly required: readonly ["mediaUrl"];
                readonly properties: {
                    readonly mediaUrl: {
                        readonly type: "string";
                        readonly description: "URL of the media to be sent";
                        readonly minLength: 1;
                        readonly maxLength: 2048;
                        readonly examples: readonly ["https://example.com/image.jpg"];
                    };
                    readonly caption: {
                        readonly type: "string";
                        readonly description: "Caption for the media";
                        readonly minLength: 1;
                        readonly maxLength: 3000;
                        readonly examples: readonly ["This is a caption"];
                    };
                };
            };
        };
        readonly required: readonly ["to", "content"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const OutgoingMessagesWhatsappInteractive: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly from: {
                readonly type: "string";
                readonly description: "The phone number from which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly to: {
                readonly type: "string";
                readonly description: "The phone number to which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly messageId: {
                readonly type: "string";
                readonly description: "Message ID (UUID v4) to be used for the message. If not provided, a random UUID v4 will be generated";
                readonly minLength: 36;
                readonly maxLength: 36;
                readonly examples: readonly ["uuid-v4"];
            };
            readonly content: {
                readonly description: "Text message to be sent";
                readonly type: "object";
                readonly required: readonly ["body", "buttons"];
                readonly properties: {
                    readonly header: {
                        readonly type: "string";
                        readonly description: "The header text to be sent";
                        readonly maxLength: 60;
                        readonly examples: readonly ["Header text"];
                    };
                    readonly body: {
                        readonly type: "string";
                        readonly description: "The body of the message to be sent";
                        readonly maxLength: 1024;
                        readonly examples: readonly ["Message body"];
                    };
                    readonly footer: {
                        readonly type: "string";
                        readonly description: "The footer text to be sent";
                        readonly maxLength: 20;
                        readonly examples: readonly ["Footer text"];
                    };
                    readonly buttons: {
                        readonly type: "array";
                        readonly description: "Array of buttons to be sent";
                        readonly items: {
                            readonly type: "object";
                            readonly required: readonly ["id", "title"];
                            readonly properties: {
                                readonly id: {
                                    readonly type: "string";
                                    readonly description: "A unique identifier";
                                    readonly maxLength: 60;
                                    readonly examples: readonly ["uuid-v4"];
                                };
                                readonly title: {
                                    readonly type: "string";
                                    readonly description: "The title of button to be displayed";
                                    readonly maxLength: 20;
                                    readonly examples: readonly ["Button title"];
                                };
                            };
                        };
                    };
                };
            };
        };
        readonly required: readonly ["to", "content"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const OutgoingMessagesWhatsappInteractiveList: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly from: {
                readonly type: "string";
                readonly description: "The phone number from which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly to: {
                readonly type: "string";
                readonly description: "The phone number to which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly messageId: {
                readonly type: "string";
                readonly description: "Message ID (UUID v4) to be used for the message. If not provided, a random UUID v4 will be generated";
                readonly minLength: 36;
                readonly maxLength: 36;
                readonly examples: readonly ["uuid-v4"];
            };
            readonly content: {
                readonly description: "Text message to be sent";
                readonly type: "object";
                readonly required: readonly ["body", "button", "sections"];
                readonly properties: {
                    readonly header: {
                        readonly type: "string";
                        readonly description: "The header text to be sent";
                        readonly maxLength: 60;
                        readonly examples: readonly ["Header text"];
                    };
                    readonly body: {
                        readonly type: "string";
                        readonly description: "The body of the message to be sent";
                        readonly maxLength: 1024;
                        readonly examples: readonly ["Message body"];
                    };
                    readonly footer: {
                        readonly type: "string";
                        readonly description: "The footer text to be sent";
                        readonly maxLength: 20;
                        readonly examples: readonly ["Footer text"];
                    };
                    readonly button: {
                        readonly type: "string";
                        readonly description: "The button for opening the list";
                        readonly maxLength: 20;
                        readonly examples: readonly ["Button text"];
                    };
                    readonly sections: {
                        readonly type: "array";
                        readonly description: "Array of sections to be sent";
                        readonly items: {
                            readonly type: "object";
                            readonly required: readonly ["rows"];
                            readonly properties: {
                                readonly title: {
                                    readonly type: "string";
                                    readonly description: "The title of section to be displayed";
                                    readonly maxLength: 24;
                                    readonly examples: readonly ["Section title"];
                                };
                                readonly rows: {
                                    readonly type: "array";
                                    readonly description: "Array of sections to be sent";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly required: readonly ["id", "title"];
                                        readonly properties: {
                                            readonly id: {
                                                readonly type: "string";
                                                readonly description: "A unique identifier";
                                                readonly maxLength: 60;
                                                readonly examples: readonly ["uuid-v4"];
                                            };
                                            readonly title: {
                                                readonly type: "string";
                                                readonly description: "The title of row to be displayed";
                                                readonly maxLength: 24;
                                                readonly examples: readonly ["Row title"];
                                            };
                                            readonly description: {
                                                readonly type: "string";
                                                readonly description: "The description of row to be displayed";
                                                readonly maxLength: 72;
                                                readonly examples: readonly ["Row description"];
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        readonly required: readonly ["to", "content"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const OutgoingMessagesWhatsappLocation: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly from: {
                readonly type: "string";
                readonly description: "The phone number from which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly to: {
                readonly type: "string";
                readonly description: "The phone number to which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly messageId: {
                readonly type: "string";
                readonly description: "Message ID (UUID v4) to be used for the message. If not provided, a random UUID v4 will be generated";
                readonly minLength: 36;
                readonly maxLength: 36;
                readonly examples: readonly ["uuid-v4"];
            };
            readonly content: {
                readonly description: "Location message to be sent";
                readonly type: "object";
                readonly required: readonly ["latitude", "longitude"];
                readonly properties: {
                    readonly latitude: {
                        readonly type: "number";
                        readonly description: "The latitude of the location";
                        readonly examples: readonly [19.082502];
                    };
                    readonly longitude: {
                        readonly type: "number";
                        readonly description: "The longitude of the location";
                        readonly examples: readonly [72.7163737];
                    };
                    readonly name: {
                        readonly type: "string";
                        readonly description: "The name of the location";
                        readonly examples: readonly ["Mumbai"];
                    };
                    readonly address: {
                        readonly type: "string";
                        readonly description: "The address of the location";
                        readonly examples: readonly ["Mumbai, Maharashtra, India"];
                    };
                };
            };
        };
        readonly required: readonly ["to", "content"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const OutgoingMessagesWhatsappTemplate: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly messages: {
                readonly description: "Array of template messages to be sent";
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly from: {
                            readonly type: "string";
                            readonly description: "The phone number from which the message is sent, with the country code";
                            readonly minLength: 10;
                            readonly maxLength: 15;
                            readonly format: "phone";
                            readonly examples: readonly ["+919999999999"];
                        };
                        readonly to: {
                            readonly type: "string";
                            readonly description: "The phone number to which the message is sent, with the country code";
                            readonly minLength: 10;
                            readonly maxLength: 15;
                            readonly format: "phone";
                            readonly examples: readonly ["+919999999999"];
                        };
                        readonly messageId: {
                            readonly type: "string";
                            readonly description: "Message ID (UUID v4) to be used for the message. If not provided, a random UUID v4 will be generated";
                            readonly minLength: 36;
                            readonly maxLength: 36;
                            readonly examples: readonly ["uuid-v4"];
                        };
                        readonly content: {
                            readonly description: "Template message to be sent";
                            readonly type: "object";
                            readonly required: readonly ["templateName", "language"];
                            readonly properties: {
                                readonly templateName: {
                                    readonly type: "string";
                                    readonly description: "Template name";
                                    readonly examples: readonly ["template_name"];
                                };
                                readonly language: {
                                    readonly type: "string";
                                    readonly description: "Template language";
                                    readonly default: "en";
                                    readonly enum: readonly ["en", "en_US", "en_GB", "pt_BR", "es", "id"];
                                    readonly examples: readonly ["en"];
                                };
                                readonly templateData: {
                                    readonly description: "Template data";
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly header: {
                                            readonly description: "Template header";
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                    readonly description: "Template header type";
                                                    readonly enum: readonly ["TEXT", "IMAGE", "DOCUMENT", "VIDEO", "LOCATION"];
                                                    readonly examples: readonly ["TEXT"];
                                                };
                                                readonly placeholder: {
                                                    readonly type: "string";
                                                    readonly description: "Template header text";
                                                    readonly examples: readonly ["Header text"];
                                                };
                                                readonly mediaUrl: {
                                                    readonly type: "string";
                                                    readonly description: "Template header media link (only for IMAGE, VIDEO or DOCUMENT type)";
                                                    readonly examples: readonly ["https://example.com/image.png"];
                                                };
                                                readonly filename: {
                                                    readonly type: "string";
                                                    readonly description: "Template header document caption";
                                                    readonly examples: readonly ["Document caption"];
                                                };
                                                readonly latitude: {
                                                    readonly type: "number";
                                                    readonly description: "Template header location latitude";
                                                    readonly examples: readonly [-23.5505199];
                                                };
                                                readonly longitude: {
                                                    readonly type: "number";
                                                    readonly description: "Template header location longitude";
                                                    readonly examples: readonly [-46.6333094];
                                                };
                                            };
                                        };
                                        readonly body: {
                                            readonly description: "Template body";
                                            readonly type: "object";
                                            readonly required: readonly ["placeholders"];
                                            readonly properties: {
                                                readonly placeholders: {
                                                    readonly description: "Template body components";
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                        readonly examples: readonly ["Saurav"];
                                                    };
                                                    readonly examples: readonly ["Body text"];
                                                };
                                            };
                                        };
                                        readonly buttons: {
                                            readonly description: "Template buttons";
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["type"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly description: "Template button type";
                                                        readonly enum: readonly ["URL"];
                                                        readonly examples: readonly ["URL"];
                                                    };
                                                    readonly parameter: {
                                                        readonly type: "string";
                                                        readonly description: "Template button text (Required only when the URL is dynamic)";
                                                        readonly examples: readonly ["Button text"];
                                                    };
                                                };
                                            };
                                        };
                                        readonly cards: {
                                            readonly description: "Template carousel cards";
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["type"];
                                                readonly properties: {
                                                    readonly cardIndex: {
                                                        readonly type: "number";
                                                        readonly description: "Index of the card - 0 Represents the first card";
                                                        readonly examples: readonly ["0"];
                                                    };
                                                    readonly components: {
                                                        readonly type: "object";
                                                        readonly description: "Carousel cards components";
                                                        readonly properties: {
                                                            readonly header: {
                                                                readonly description: "Carousel card header";
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly type: {
                                                                        readonly type: "string";
                                                                        readonly description: "Carousel card header type";
                                                                        readonly enum: readonly ["IMAGE", "VIDEO"];
                                                                        readonly examples: readonly ["IMAGE"];
                                                                    };
                                                                    readonly mediaUrl: {
                                                                        readonly type: "string";
                                                                        readonly description: "Carousel card header media link (only for IMAGE, VIDEO type)";
                                                                        readonly examples: readonly ["https://example.com/image.png"];
                                                                    };
                                                                };
                                                            };
                                                            readonly body: {
                                                                readonly description: "Carousel card body";
                                                                readonly type: "object";
                                                                readonly required: readonly ["placeholders"];
                                                                readonly properties: {
                                                                    readonly placeholders: {
                                                                        readonly description: "Template body components";
                                                                        readonly type: "array";
                                                                        readonly items: {
                                                                            readonly type: "string";
                                                                        };
                                                                        readonly examples: readonly ["Body text"];
                                                                    };
                                                                };
                                                            };
                                                            readonly buttons: {
                                                                readonly description: "Carousel card buttons";
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["type"];
                                                                    readonly properties: {
                                                                        readonly type: {
                                                                            readonly type: "string";
                                                                            readonly description: "Template button type";
                                                                            readonly enum: readonly ["URL"];
                                                                            readonly examples: readonly ["URL"];
                                                                        };
                                                                        readonly parameter: {
                                                                            readonly type: "string";
                                                                            readonly description: "Template button text (Required only when the URL is dynamic)";
                                                                            readonly examples: readonly ["Button text"];
                                                                        };
                                                                    };
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    readonly required: readonly ["to", "content"];
                };
            };
        };
        readonly required: readonly ["messages"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const OutgoingMessagesWhatsappText: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly from: {
                readonly type: "string";
                readonly description: "The phone number from which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly to: {
                readonly type: "string";
                readonly description: "The phone number to which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly messageId: {
                readonly type: "string";
                readonly description: "Message ID (UUID v4) to be used for the message. If not provided, a random UUID v4 will be generated";
                readonly minLength: 36;
                readonly maxLength: 36;
                readonly examples: readonly ["uuid-v4"];
            };
            readonly content: {
                readonly description: "Text message to be sent";
                readonly type: "object";
                readonly required: readonly ["text"];
                readonly properties: {
                    readonly text: {
                        readonly type: "string";
                        readonly description: "The text message to be sent";
                        readonly examples: readonly ["Hello, world!"];
                    };
                };
            };
        };
        readonly required: readonly ["to", "content"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const OutgoingMessagesWhatsappVideo: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly from: {
                readonly type: "string";
                readonly description: "The phone number from which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly to: {
                readonly type: "string";
                readonly description: "The phone number to which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly messageId: {
                readonly type: "string";
                readonly description: "Message ID (UUID v4) to be used for the message. If not provided, a random UUID v4 will be generated";
                readonly minLength: 36;
                readonly maxLength: 36;
                readonly examples: readonly ["uuid-v4"];
            };
            readonly content: {
                readonly description: "Video message to be sent";
                readonly type: "object";
                readonly required: readonly ["mediaUrl"];
                readonly properties: {
                    readonly mediaUrl: {
                        readonly type: "string";
                        readonly description: "URL of the media to be sent";
                        readonly minLength: 1;
                        readonly maxLength: 2048;
                        readonly examples: readonly ["https://example.com/image.jpg"];
                    };
                    readonly caption: {
                        readonly type: "string";
                        readonly description: "Caption for the media";
                        readonly minLength: 1;
                        readonly maxLength: 3000;
                        readonly examples: readonly ["This is a caption"];
                    };
                };
            };
        };
        readonly required: readonly ["to", "content"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const RegisterWebhook: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly url: {
                readonly type: "string";
                readonly format: "uri";
                readonly description: "URL of the webhook";
                readonly examples: readonly ["https://example.com/webhook"];
            };
            readonly method: {
                readonly type: "string";
                readonly description: "HTTP method used for the webhook";
                readonly enum: readonly ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"];
                readonly examples: readonly ["POST"];
            };
            readonly headers: {
                readonly type: "object";
                readonly description: "Custom headers to be sent with the webhook";
                readonly additionalProperties: true;
            };
            readonly body: {
                readonly type: "object";
                readonly description: "Payload to be sent with the webhook";
                readonly additionalProperties: true;
            };
            readonly query: {
                readonly type: "object";
                readonly description: "Query parameters to be included in the webhook URL";
                readonly additionalProperties: true;
            };
            readonly bodyFormat: {
                readonly type: "string";
                readonly description: "Format of the body content";
                readonly enum: readonly ["JSON", "FORM_DATA"];
                readonly examples: readonly ["JSON"];
            };
            readonly authorization: {
                readonly type: "object";
                readonly description: "Authorization details for the webhook";
                readonly properties: {
                    readonly type: {
                        readonly type: "string";
                        readonly description: "The type of authorization used for the webhook";
                        readonly enum: readonly ["BASIC", "BEARER"];
                        readonly examples: readonly ["BEARER"];
                    };
                    readonly payload: {
                        readonly type: "string";
                        readonly description: "The authorization payload, such as a token or credentials";
                        readonly examples: readonly ["some-secure-token"];
                    };
                };
                readonly required: readonly ["type", "payload"];
            };
            readonly webhookEvents: {
                readonly type: "array";
                readonly description: "Events that trigger the webhook";
                readonly items: {
                    readonly type: "string";
                    readonly enum: readonly ["MESSAGE_RECEIVED", "MESSAGE_STATUS_UPDATE", "CHAT_ASSIGNED_TO_AGENT", "CHAT_UNASSIGNED", "UPDATE_CUSTOMER_CUSTOM_FIELD", "WIDGET_LEAD_RECEIVED", "VERIFIED_WIDGET_LEAD_RECEIVED", "NEW_LEAD", "RAW_CLOUD_API_WEBHOOK", "CLOSE_CONVERSATION", "TEMPLATE_UPDATE", "ADD_TAG", "REMOVE_TAG", "CALL_TO_WHATSAPP_MESSAGE_RECEIVED", "CONVERSATION_OPENED", "CUSTOMER_BUSINESS_CHAT_OPEN"];
                };
                readonly examples: readonly ["MESSAGE_RECEIVED", "CLOSE_CONVERSATION"];
            };
            readonly retryOnTimeout: {
                readonly type: "boolean";
                readonly description: "Retry the webhook call on timeout";
            };
            readonly name: {
                readonly type: "string";
                readonly description: "Name of the webhook";
            };
            readonly wabaNumbers: {
                readonly type: "array";
                readonly description: "List of WABA numbers associated with the webhook";
                readonly items: {
                    readonly type: "string";
                    readonly minLength: 10;
                    readonly maxLength: 15;
                    readonly format: "phone";
                    readonly examples: readonly ["+919999999999"];
                };
            };
        };
        readonly required: readonly ["url", "method", "webhookEvents", "name", "wabaNumbers"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly validWebhooks: {
                    readonly type: "array";
                    readonly description: "A list of valid webhooks";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly wabaNumber: {
                                readonly type: "string";
                                readonly description: "The WABA (WhatsApp Business Account) number associated with the webhook";
                                readonly examples: readonly ["+919999999999"];
                            };
                            readonly webhookEventType: {
                                readonly type: "string";
                                readonly description: "The type of event that triggers the webhook\n\n`MESSAGE_RECEIVED` `MESSAGE_STATUS_UPDATE` `CHAT_ASSIGNED_TO_AGENT` `CHAT_UNASSIGNED` `UPDATE_CUSTOMER_CUSTOM_FIELD` `WIDGET_LEAD_RECEIVED` `VERIFIED_WIDGET_LEAD_RECEIVED` `NEW_LEAD` `RAW_CLOUD_API_WEBHOOK` `CLOSE_CONVERSATION` `TEMPLATE_UPDATE` `ADD_TAG` `REMOVE_TAG` `CALL_TO_WHATSAPP_MESSAGE_RECEIVED` `CONVERSATION_OPENED` `CUSTOMER_BUSINESS_CHAT_OPEN`";
                                readonly enum: readonly ["MESSAGE_RECEIVED", "MESSAGE_STATUS_UPDATE", "CHAT_ASSIGNED_TO_AGENT", "CHAT_UNASSIGNED", "UPDATE_CUSTOMER_CUSTOM_FIELD", "WIDGET_LEAD_RECEIVED", "VERIFIED_WIDGET_LEAD_RECEIVED", "NEW_LEAD", "RAW_CLOUD_API_WEBHOOK", "CLOSE_CONVERSATION", "TEMPLATE_UPDATE", "ADD_TAG", "REMOVE_TAG", "CALL_TO_WHATSAPP_MESSAGE_RECEIVED", "CONVERSATION_OPENED", "CUSTOMER_BUSINESS_CHAT_OPEN"];
                                readonly examples: readonly ["MESSAGE_RECEIVED"];
                            };
                        };
                        readonly required: readonly ["wabaNumber", "webhookEventType"];
                    };
                };
                readonly invalidWebhooks: {
                    readonly type: "array";
                    readonly description: "A list of invalid webhooks";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly wabaNumber: {
                                readonly type: "string";
                                readonly description: "The WABA (WhatsApp Business Account) number associated with the webhook";
                                readonly examples: readonly ["+919999999999"];
                            };
                            readonly webhookEventType: {
                                readonly type: "string";
                                readonly description: "The type of event that triggers the webhook\n\n`MESSAGE_RECEIVED` `MESSAGE_STATUS_UPDATE` `CHAT_ASSIGNED_TO_AGENT` `CHAT_UNASSIGNED` `UPDATE_CUSTOMER_CUSTOM_FIELD` `WIDGET_LEAD_RECEIVED` `VERIFIED_WIDGET_LEAD_RECEIVED` `NEW_LEAD` `RAW_CLOUD_API_WEBHOOK` `CLOSE_CONVERSATION` `TEMPLATE_UPDATE` `ADD_TAG` `REMOVE_TAG` `CALL_TO_WHATSAPP_MESSAGE_RECEIVED` `CONVERSATION_OPENED` `CUSTOMER_BUSINESS_CHAT_OPEN`";
                                readonly enum: readonly ["MESSAGE_RECEIVED", "MESSAGE_STATUS_UPDATE", "CHAT_ASSIGNED_TO_AGENT", "CHAT_UNASSIGNED", "UPDATE_CUSTOMER_CUSTOM_FIELD", "WIDGET_LEAD_RECEIVED", "VERIFIED_WIDGET_LEAD_RECEIVED", "NEW_LEAD", "RAW_CLOUD_API_WEBHOOK", "CLOSE_CONVERSATION", "TEMPLATE_UPDATE", "ADD_TAG", "REMOVE_TAG", "CALL_TO_WHATSAPP_MESSAGE_RECEIVED", "CONVERSATION_OPENED", "CUSTOMER_BUSINESS_CHAT_OPEN"];
                                readonly examples: readonly ["MESSAGE_RECEIVED"];
                            };
                        };
                        readonly required: readonly ["wabaNumber", "webhookEventType"];
                    };
                };
                readonly invalidWabaNumbers: {
                    readonly type: "array";
                    readonly description: "A list of invalid WABA numbers";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["+918888888880"];
                    };
                };
            };
            readonly required: readonly ["validWebhooks", "invalidWebhooks", "invalidWabaNumbers"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const RemoveTeamMember: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly memberPhoneNumber: {
                readonly type: "string";
                readonly description: "Phone number of the team member";
            };
        };
        readonly required: readonly ["memberPhoneNumber"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly description: "Indicates whether the operation was successful";
                };
            };
            readonly required: readonly ["success"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [422];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["User not found"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const SendBroadcastMessage: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly groupName: {
                readonly type: "string";
                readonly description: "The name of the WhatsApp group to send the message to";
                readonly examples: readonly ["Test Group"];
            };
            readonly from: {
                readonly type: "string";
                readonly description: "The phone number from which the message is sent, with the country code";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
            readonly content: {
                readonly type: "object";
                readonly properties: {
                    readonly templateName: {
                        readonly type: "string";
                        readonly description: "Template name";
                        readonly examples: readonly ["template_name"];
                    };
                    readonly language: {
                        readonly type: "string";
                        readonly description: "Template language";
                        readonly default: "en";
                        readonly enum: readonly ["en", "en_US", "en_GB", "pt_BR", "es", "id"];
                        readonly examples: readonly ["en"];
                    };
                    readonly templateData: {
                        readonly description: "Template data";
                        readonly type: "object";
                        readonly properties: {
                            readonly header: {
                                readonly description: "Template header";
                                readonly type: "object";
                                readonly properties: {
                                    readonly type: {
                                        readonly type: "string";
                                        readonly description: "Template header type";
                                        readonly enum: readonly ["TEXT", "IMAGE", "DOCUMENT", "VIDEO", "LOCATION"];
                                        readonly examples: readonly ["TEXT"];
                                    };
                                    readonly placeholder: {
                                        readonly type: "string";
                                        readonly description: "Template header text";
                                        readonly examples: readonly ["Header text"];
                                    };
                                    readonly mediaUrl: {
                                        readonly type: "string";
                                        readonly description: "Template header media link (only for IMAGE, VIDEO or DOCUMENT type)";
                                        readonly examples: readonly ["https://example.com/image.png"];
                                    };
                                    readonly filename: {
                                        readonly type: "string";
                                        readonly description: "Template header document caption";
                                        readonly examples: readonly ["Document caption"];
                                    };
                                    readonly latitude: {
                                        readonly type: "number";
                                        readonly description: "Template header location latitude";
                                        readonly examples: readonly [-23.5505199];
                                    };
                                    readonly longitude: {
                                        readonly type: "number";
                                        readonly description: "Template header location longitude";
                                        readonly examples: readonly [-46.6333094];
                                    };
                                };
                            };
                            readonly body: {
                                readonly description: "Template body";
                                readonly type: "object";
                                readonly required: readonly ["placeholders"];
                                readonly properties: {
                                    readonly placeholders: {
                                        readonly description: "Template body components";
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                        readonly examples: readonly ["Body text"];
                                    };
                                };
                            };
                            readonly buttons: {
                                readonly description: "Template buttons";
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly required: readonly ["type"];
                                    readonly properties: {
                                        readonly type: {
                                            readonly type: "string";
                                            readonly description: "Template button type";
                                            readonly enum: readonly ["URL"];
                                            readonly examples: readonly ["URL"];
                                        };
                                        readonly parameter: {
                                            readonly type: "string";
                                            readonly description: "Template button text (Required only when the URL is dynamic)";
                                            readonly examples: readonly ["Button text"];
                                        };
                                    };
                                };
                            };
                            readonly cards: {
                                readonly description: "Template carousel cards";
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly required: readonly ["type"];
                                    readonly properties: {
                                        readonly cardIndex: {
                                            readonly type: "number";
                                            readonly description: "Index of the card - 0 Represents the first card";
                                            readonly examples: readonly ["0"];
                                        };
                                        readonly components: {
                                            readonly type: "object";
                                            readonly description: "Carousel cards components";
                                            readonly properties: {
                                                readonly header: {
                                                    readonly description: "Carousel card header";
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly description: "Carousel card header type";
                                                            readonly enum: readonly ["IMAGE", "VIDEO"];
                                                            readonly examples: readonly ["IMAGE"];
                                                        };
                                                        readonly mediaUrl: {
                                                            readonly type: "string";
                                                            readonly description: "Carousel card header media link (only for IMAGE, VIDEO type)";
                                                            readonly examples: readonly ["https://example.com/image.png"];
                                                        };
                                                    };
                                                };
                                                readonly body: {
                                                    readonly description: "Carousel card body";
                                                    readonly type: "object";
                                                    readonly required: readonly ["placeholders"];
                                                    readonly properties: {
                                                        readonly placeholders: {
                                                            readonly description: "Template body components";
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                            };
                                                            readonly examples: readonly ["Body text"];
                                                        };
                                                    };
                                                };
                                                readonly buttons: {
                                                    readonly description: "Carousel card buttons";
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["type"];
                                                        readonly properties: {
                                                            readonly type: {
                                                                readonly type: "string";
                                                                readonly description: "Template button type";
                                                                readonly enum: readonly ["URL"];
                                                                readonly examples: readonly ["URL"];
                                                            };
                                                            readonly parameter: {
                                                                readonly type: "string";
                                                                readonly description: "Template button text (Required only when the URL is dynamic)";
                                                                readonly examples: readonly ["Button text"];
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                readonly required: readonly ["templateName", "language"];
            };
        };
        readonly required: readonly ["groupName"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly status: {
                    readonly type: "string";
                    readonly description: "The status of the sent message (SENT or FAILED)\n\n`SENT` `FAILED`";
                    readonly enum: readonly ["SENT", "FAILED"];
                    readonly examples: readonly ["SENT"];
                };
                readonly messageId: {
                    readonly type: "string";
                    readonly description: "The ID of the sent message";
                    readonly examples: readonly ["e7de18e6-9e96-4a7b-b570-93eaa0518584"];
                };
                readonly errorMessage: {
                    readonly type: "string";
                    readonly description: "The error message in case of a failed message";
                    readonly examples: readonly ["Sample Error"];
                };
            };
            readonly required: readonly ["status", "messageId"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const UnassignTeamMemberFromChat: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly customerPhoneNumber: {
                readonly description: "Phone number of customer";
                readonly type: "string";
                readonly minLength: 7;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["919999999999"];
            };
        };
        readonly required: readonly ["customerPhoneNumber"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly examples: readonly ["true"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["customerPhoneNumber must be a string"];
                    };
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Error Text"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Invalid public api key"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [422];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["User is not a member of the team"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const UnblockUnblockCustomer: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly phone: {
                readonly type: "string";
                readonly description: "The phone number of customer which unblock operation will be performed";
                readonly minLength: 10;
                readonly maxLength: 15;
                readonly format: "phone";
                readonly examples: readonly ["+919999999999"];
            };
        };
        readonly required: readonly ["phone"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["phone must be a string"];
                    };
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Not Found"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [404];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Invalid Customer"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const UploadMedia: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly file: {
                readonly type: "string";
                readonly format: "binary";
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly mediaUrl: {
                    readonly type: "string";
                    readonly description: "Media URL";
                };
                readonly expiresIn: {
                    readonly type: "integer";
                    readonly description: "Media URL expiration time in seconds";
                };
            };
            readonly required: readonly ["mediaUrl", "expiresIn"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Invalid public api key"];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Unauthorized"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "402": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["File size is larger than the maximum allowed limit: 16777216 bytes."];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "number";
                    readonly examples: readonly [400];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["File type video/quicktime is not supported."];
                };
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["Bad Request"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
export { AddMemberUnderReportingManager, AddMembersToGroup, AssignTeamMemberToChat, AssignTeamMemberToCustomer, BlockUnblockCustomer, ChangeReportingManager, CheckRevertedOnTime, CreateGroup, CreateTemplate, CustomerAssignTagsCustomFields, CustomerRemoveTagsCustomFields, DeleteGroups, DeleteTemplate, DeleteWebhooks, EditTemplate, EditWebhooks, ExportChatsToExcel, GetAllRoles, GetChatMessages, GetChatWindowStatus, GetCustomerDetails, GetPaginatedGroupsV2, GetTeam, GetTeamMemberDetails, GetTemplates, GetWalletBalanaceForOrg, GetWebhooks, LogoutTeamMember, OutgoingMessagesWhatsappAudio, OutgoingMessagesWhatsappDocument, OutgoingMessagesWhatsappImage, OutgoingMessagesWhatsappInteractive, OutgoingMessagesWhatsappInteractiveList, OutgoingMessagesWhatsappLocation, OutgoingMessagesWhatsappTemplate, OutgoingMessagesWhatsappText, OutgoingMessagesWhatsappVideo, RegisterWebhook, RemoveTeamMember, SendBroadcastMessage, UnassignTeamMemberFromChat, UnblockUnblockCustomer, UploadMedia };
