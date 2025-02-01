import { Column, Schema as glueSchema, Type } from '@aws-cdk/aws-glue-alpha';
import * as protobuf from 'protobufjs';

export interface IGlueJsonSchema {
  name: string;
  type: string;
}

// Utility type guard to safely check object keys
function assertKey<T extends object>(obj: T, key: unknown): key is keyof T {
  return typeof key === 'string' && key in obj;
}

// https://docs.aws.amazon.com/athena/latest/ug/data-types.html
// Comprehensive type mapping for Protobuf to Glue schema conversion
export const DEFAULT_TYPE_MAPPING = {
  double: glueSchema.DOUBLE,
  float: glueSchema.FLOAT,
  int64: glueSchema.BIG_INT,
  uint64: glueSchema.BIG_INT,
  int32: glueSchema.INTEGER,
  bool: glueSchema.BOOLEAN,
  string: glueSchema.STRING,
  bytes: glueSchema.STRING,
  enum: glueSchema.STRING,
};

export interface IProtoToGlueConfig {
  // Optional type mapping for Protobuf to Glue schema conversion
  typeMapping?: Record<string, Type>;
}

export class ProtoToGlueConverter {
  // Cache for processed message types to prevent redundant processing
  private readonly _processedMessages: Record<string, Column[]>;
  private readonly config: Required<IProtoToGlueConfig>;

  constructor(config: IProtoToGlueConfig = {}) {
    this._processedMessages = {};
    this.config = {
      typeMapping: {
        ...DEFAULT_TYPE_MAPPING,
        ...config.typeMapping,
      },
    };
  }

  /**
   * Loads and parses a .proto file with error handling
   * @param protoFile Path to the .proto file
   * @returns Parsed protobuf Root object
   */
  private _loadProtoFile(protoFile: string): protobuf.Root {
    try {
      // Load the proto file
      const root = new protobuf.Root().loadSync(protoFile, { keepCase: true });

      return root;
    } catch (error: unknown) {
      console.error(`Failed to load proto file`, error);
      throw error;
    }
  }

  /**
   * Converts a Protobuf repeated field to a Glue array column
   * @param field Protobuf field definition
   * @returns Glue array column definition
   */
  private _resolveRepeatedField(field: protobuf.Field): Column {
    field.resolve();

    return {
      type: glueSchema.array(this._convertNonRepeatedField(field).type),
      name: field.name,
    };
  }

  /**
   * Converts a non-repeated Protobuf field to a Glue column
   * @param field Protobuf field definition
   * @returns Glue column definition
   */
  private _convertNonRepeatedField(field: protobuf.Field): Column {
    field.resolve();
    const fieldType = field.resolvedType ?? field.type;

    // Handle message types (nested structures)
    if (fieldType instanceof protobuf.Type) {
      return {
        name: field.name,
        type: glueSchema.struct(this._convertMessageType(fieldType)),
      };
    }

    // Handle enum types as strings
    if (fieldType instanceof protobuf.Enum) {
      return {
        name: field.name,
        type: this.config.typeMapping.enum,
      };
    }

    // Map basic types
    if (assertKey(this.config.typeMapping, fieldType)) {
      return {
        name: field.name,
        type: this.config.typeMapping[fieldType],
      };
    }

    throw new Error(`Unsupported field type: ${fieldType}`);
  }

  /**
   * Detects circular references in Protobuf schema
   * @param messageType Current message type
   * @param referenceMessageType Original message type to check against
   */
  private _detectCircularReference(
    messageType: protobuf.Type,
    referenceMessageType: protobuf.Type
  ): void {
    messageType.resolveAll();

    // Check direct circular references
    const circularFields = Object.values(messageType.fields).filter(
      (s) => s.resolvedType === referenceMessageType
    );

    if (circularFields.length > 0) {
      throw new Error(
        `Circular reference detected for message type: ${referenceMessageType.fullName}`
      );
    }
    // Recursively check nested types
    for (const field of Object.values(messageType.fields)) {
      if (field.resolvedType instanceof protobuf.Type) {
        this._detectCircularReference(field.resolvedType, referenceMessageType);
      }
    }
  }

  /**
   * Converts a Protobuf field to a Glue column
   * @param field Protobuf field definition
   * @returns Glue column definition
   */
  private _convertField(field: protobuf.Field): Column {
    field.resolve();

    return field.repeated
      ? this._resolveRepeatedField(field)
      : this._convertNonRepeatedField(field);
  }

  /**
   * Converts a Protobuf message type to Glue columns
   * @param messageType Protobuf message type
   * @returns List of Glue column definitions
   */
  private _convertMessageType(messageType: protobuf.Type): Column[] {
    // Prevent processing the same message type multiple times
    if (messageType.fullName in this._processedMessages) {
      return this._processedMessages[messageType.fullName];
    }

    // Check for circular reference
    this._detectCircularReference(messageType, messageType);
    const columns = Object.values(messageType.fields).map((field) => this._convertField(field));

    this._processedMessages[messageType.fullName] = columns;

    return columns;
  }

  /**
   * Generates a Glue table schema from a Protobuf schema
   * @param protoFile Path to the .proto file
   * @param messageName Optional specific message name to convert
   * @returns Glue table schema columns
   */
  public generateGlueSchema(protoFile: string, messageName?: string): Column[] {
    try {
      const root = this._loadProtoFile(protoFile).resolveAll();

      const targetType =
        messageName !== undefined
          ? root.lookupType(messageName)
          : root.nestedArray.find((nested) => nested instanceof protobuf.Type);

      if (!targetType) {
        throw new Error(`Message type not found in proto file`);
      }

      return this._convertMessageType(targetType);
    } catch (error: unknown) {
      console.error(`Failed to load proto file`, error);
      throw error;
    }
  }
}

/**
 * Convenience function to convert Protobuf schema to Glue table schema
 * This is to mainly be used as part of cdk code.
 * @param protoFile Path to the .proto file
 * @param messageName Optional message name
 * @param config Optional configuration for type mapping
 * @returns Glue table schema
 */
export function convertProtoToGlueSchema(
  protoFile: string,
  messageName?: string,
  config?: IProtoToGlueConfig
): Column[] {
  return new ProtoToGlueConverter(config).generateGlueSchema(protoFile, messageName);
}

/**
 * Converts Protobuf schema to Glue table schema in JSON format
 * @param protoFile Path to the .proto file
 * @param messageName Optional message name
 * @param config Optional configuration for type mapping
 * @returns Glue table schema as JSON
 */
export function convertProtoToJSONGlueSchema(
  protoFile: string,
  messageName?: string,
  config?: IProtoToGlueConfig
): IGlueJsonSchema[] {
  return convertProtoToGlueSchema(protoFile, messageName, config).map((c) => ({
    type: c.type.inputString,
    name: c.name,
  }));
}
