import * as protobuf from 'protobufjs';
import {
  ProtoToGlueConverter,
  convertProtoToGlueSchema,
  convertProtoToJSONGlueSchema,
} from '../..';
import { Schema as glueSchema } from '@aws-cdk/aws-glue-alpha';
import * as fs from 'fs';
import * as path from 'path';

describe('ProtoToGlueConverter', () => {
  let converter: ProtoToGlueConverter;
  let mockProtoFile: string;

  beforeEach(() => {
    converter = new ProtoToGlueConverter();

    // Create a comprehensive mock .proto file
    mockProtoFile = path.join(__dirname, 'test-comprehensive-mock.proto');
    fs.writeFileSync(
      mockProtoFile,
      `
      syntax = "proto3";
      
      enum GlobalStatus {
        UNKNOWN = 0;
        ACTIVE = 1;
        INACTIVE = 2;
      }
      
      message NestedMessage {
        bool is_active = 1;
        double score = 2;
      }
      
      message TestMessage {
        string name = 1;
        int32 age = 2;
        double height = 3;
        float weight = 4;
        bool is_student = 5;
        bytes custom_data = 6;
        
        repeated string hobbies = 7;
        repeated int64 scores = 8;
        
        NestedMessage nested_info = 9;
        GlobalStatus user_status = 10;
        repeated GlobalStatus status_history = 11;
        
        enum LocalStatus {
          LOCAL_UNKNOWN = 0;
          LOCAL_GOOD = 1;
          LOCAL_BAD = 2;
        }
        LocalStatus local_status = 12;
      }
    `
    );
  });

  afterEach(() => {
    // Clean up mock proto file
    if (fs.existsSync(mockProtoFile)) {
      fs.unlinkSync(mockProtoFile);
    }
  });

  describe('_loadProtoFile', () => {
    it('should load a valid proto file', () => {
      const root = (converter as any)._loadProtoFile(mockProtoFile);
      expect(root).toBeInstanceOf(protobuf.Root);
    });

    it('should throw error for non-existent proto file', () => {
      expect(() => (converter as any)._loadProtoFile('/path/to/nonexistent.proto')).toThrow();
    });
  });

  describe('_convertField', () => {
    let root: protobuf.Root;
    let testMessage: protobuf.Type;

    beforeEach(() => {
      root = new protobuf.Root().loadSync(mockProtoFile, { keepCase: true });
      testMessage = root.lookupType('TestMessage');
    });

    // Test various field types
    const testCases = [
      { fieldName: 'name', expectedType: glueSchema.STRING },
      { fieldName: 'age', expectedType: glueSchema.INTEGER },
      { fieldName: 'height', expectedType: glueSchema.DOUBLE },
      { fieldName: 'weight', expectedType: glueSchema.FLOAT },
      { fieldName: 'is_student', expectedType: glueSchema.BOOLEAN },
      { fieldName: 'custom_data', expectedType: glueSchema.STRING },
      { fieldName: 'user_status', expectedType: glueSchema.STRING },
      { fieldName: 'local_status', expectedType: glueSchema.STRING },
    ];

    testCases.forEach(({ fieldName, expectedType }) => {
      it(`should convert ${fieldName} field correctly`, () => {
        const field = testMessage.fields[fieldName];
        const column = (converter as any)._convertField(field);
        expect(column.name).toBe(fieldName);
        expect(column.type).toEqual(expectedType);
      });
    });

    // Test repeated fields
    it('should convert repeated string field correctly', () => {
      const hobbiesField = testMessage.fields.hobbies;
      const column = (converter as any)._convertField(hobbiesField);
      expect(column.name).toBe('hobbies');
      expect(column.type).toEqual(glueSchema.array(glueSchema.STRING));
    });

    it('should convert repeated int64 field correctly', () => {
      const scoresField = testMessage.fields.scores;
      const column = (converter as any)._convertField(scoresField);
      expect(column.name).toBe('scores');
      expect(column.type).toEqual(glueSchema.array(glueSchema.BIG_INT));
    });

    it('should convert repeated enum field correctly', () => {
      const statusHistoryField = testMessage.fields.status_history;
      const column = (converter as any)._convertField(statusHistoryField);
      expect(column.name).toBe('status_history');
      expect(column.type).toEqual(glueSchema.array(glueSchema.STRING));
    });

    it('should convert nested message field correctly', () => {
      const nestedField = testMessage.fields.nested_info;
      const column = (converter as any)._convertField(nestedField);
      expect(column.name).toBe('nested_info');
      expect(column.type).toBeInstanceOf(Object);
    });

    it('should throw error for unsupported types', () => {
      const mockField = {
        name: 'unsupported',
        type: 'unsupported_type',
        repeated: false,
        resolve: () => {},
        resolvedType: null,
      } as protobuf.Field;

      expect(() => (converter as any)._convertField(mockField)).toThrow();
    });
  });

  describe('generateGlueSchema', () => {
    it('should generate schema for default message', () => {
      const schema = converter.generateGlueSchema(mockProtoFile);
      expect(schema.length).toBeGreaterThan(0);
      expect(schema[0]).toHaveProperty('name');
      expect(schema[0]).toHaveProperty('type');
    });

    it('should generate schema for specific message', () => {
      const schema = converter.generateGlueSchema(mockProtoFile, 'TestMessage');
      expect(schema.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent message', () => {
      expect(() => converter.generateGlueSchema(mockProtoFile, 'NonExistentMessage')).toThrow();
    });
  });

  describe('Error Scenarios in generateGlueSchema', () => {
    it('should throw error when no message types are found', () => {
      const emptyProtoFile = path.join(__dirname, 'test-empty-mock.proto');
      fs.writeFileSync(
        emptyProtoFile,
        `
        syntax = "proto3";
      `
      );

      try {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        expect(() => converter.generateGlueSchema(emptyProtoFile)).toThrow(
          'Message type not found in proto file'
        );

        consoleErrorSpy.mockRestore();
      } finally {
        // Clean up mock proto file
        if (fs.existsSync(emptyProtoFile)) {
          fs.unlinkSync(emptyProtoFile);
        }
      }
    });

    it('should throw error when specified message name is not found', () => {
      expect(() => converter.generateGlueSchema(mockProtoFile, 'NonExistentMessage')).toThrow();
    });
  });

  describe('Convenience Functions', () => {
    it('convertProtoToGlueSchema should work', () => {
      const schema = convertProtoToGlueSchema(mockProtoFile);
      expect(schema.length).toBeGreaterThan(0);
    });

    it('convertProtoToJSONGlueSchema should work', () => {
      const jsonSchema = convertProtoToJSONGlueSchema(mockProtoFile);
      expect(jsonSchema.length).toBeGreaterThan(0);
      expect(jsonSchema[0]).toHaveProperty('Name');
      expect(jsonSchema[0]).toHaveProperty('Type');
    });
  });

  describe('Circular Reference Handling', () => {
    it('should throw an error for direct circular reference', () => {
      const circularProtoFile = path.join(__dirname, 'test-direct-circular-mock.proto');
      fs.writeFileSync(
        circularProtoFile,
        `
      syntax = "proto3";
      message CircularMessage {
        CircularMessage self = 1;
        string name = 2;
      }
    `
      );
      try {
        expect(() => converter.generateGlueSchema(circularProtoFile)).toThrow(
          'Circular reference detected for message type: .CircularMessage'
        );
      } finally {
        // Clean up circular mock proto file
        if (fs.existsSync(circularProtoFile)) {
          fs.unlinkSync(circularProtoFile);
        }
      }
    });
    it('should throw an error for indirect circular reference', () => {
      const indirectCircularProtoFile = path.join(__dirname, 'test-indirect-circular-mock.proto');
      fs.writeFileSync(
        indirectCircularProtoFile,
        `
      syntax = "proto3";
      message MessageA {
        MessageB ref = 1;
        string name = 2;
      }
      message MessageB {
        MessageA back_ref = 1;
        int32 value = 2;
      }
    `
      );
      try {
        expect(() => converter.generateGlueSchema(indirectCircularProtoFile, 'MessageA')).toThrow(
          'Circular reference detected for message type: .MessageA'
        );
      } finally {
        // Clean up indirect circular mock proto file
        if (fs.existsSync(indirectCircularProtoFile)) {
          fs.unlinkSync(indirectCircularProtoFile);
        }
      }
    });
  });
  describe('ProtoToGlueConverter Memoization', () => {
    let converter: ProtoToGlueConverter;
    let memoryTestProtoFile: string;
    beforeEach(() => {
      converter = new ProtoToGlueConverter();
      // Create a mock proto file path with multiple references to the same message
      memoryTestProtoFile = path.join(__dirname, 'memoization-test.proto');

      // Write a mock proto file with multiple references to the same nested message type
      const mockProtoContent = `
      syntax = "proto3";

      message ParentMessage {
        NestedMessage nested_1 = 1;
        NestedMessage nested_2 = 2;
        NestedMessage nested_3 = 3;
      }

      message NestedMessage {
        string field1 = 1;
        int32 field2 = 2;
      }
    `;

      // Use filesystem write method to create the mock proto file
      fs.writeFileSync(memoryTestProtoFile, mockProtoContent);
    });

    afterEach(() => {
      // Clean up mock proto file
      if (fs.existsSync(memoryTestProtoFile)) {
        fs.unlinkSync(memoryTestProtoFile);
      }
    });

    it('should memoize message types with multiple references', () => {
      // Generate Glue schema for ParentMessage
      const generatedGlueSchema = converter.generateGlueSchema(
        memoryTestProtoFile,
        'ParentMessage'
      );

      // Verify the structure of the generated schema
      expect(
        typeof generatedGlueSchema == 'object' && Array.isArray(generatedGlueSchema)
      ).toBeTruthy();
      expect(generatedGlueSchema.length).toEqual(3); // nested_1, nested_2, nested_3

      // Verify that each nested field is of type struct and references the same NestedMessage type
      generatedGlueSchema.forEach((column) => {
        expect(column.type).toEqual(
          glueSchema.struct([
            { type: glueSchema.STRING, name: 'field1' },
            { type: glueSchema.INTEGER, name: 'field2' },
          ])
        );
      });
    });
  });
});
