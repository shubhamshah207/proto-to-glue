# proto-to-glue

**Convert Protobuf Schemas to AWS Glue Table Schemas Effortlessly**

A TypeScript library designed to simplify the process of converting Protobuf (Protocol Buffers) schemas into AWS Glue table schemas. It is particularly useful for developers working with AWS Glue and Apache Athena, enabling seamless integration of Protobuf-based data into AWS data lakes or AWS Glue catalog schema OR AWS Athena.

[![npm version](https://img.shields.io/npm/v/proto-to-glue.svg)](https://www.npmjs.com/package/proto-to-glue)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Coverage Status](https://coveralls.io/repos/github/shubhamshah207/proto-to-glue/badge.svg?branch=main)](https://coveralls.io/github/shubhamshah207/proto-to-glue?branch=main)
[![example workflow](https://github.com/shubhamshah207/proto-to-glue/actions/workflows/codeql.yml/badge.svg)](https://github.com/shubhamshah207/proto-to-glue/actions/workflows/codeql.yml)


---

## ✨ Features

- **📄 Protobuf to Glue Schema Conversion**: Automatically converts Protobuf message definitions into AWS Glue table schemas.
- **🛠️ Custom Type Mapping**: Supports custom mappings between Protobuf and Glue data types.
- **🧩 Nested Message Handling**: Handles nested Protobuf messages and converts them into Glue `struct` types.
- **🔁 Repeated Fields**: Converts Protobuf repeated fields into Glue `array` types.
- **🔄 Circular Reference Detection**: Detects and prevents circular references in Protobuf schemas.
- **📦 JSON Output**: Optionally outputs the Glue schema in JSON format for easy integration with other tools.
- **☁️ CDK Integration**: Designed to work seamlessly with AWS CDK (Cloud Development Kit).

---

## 🚀 Installation

Install the library using npm:

```bash
npm install proto-to-glue
```

---

## 🛠️ Usage

### Basic Usage

Convert a Protobuf schema to a Glue schema:

```typescript
import { convertProtoToGlueSchema } from 'proto-to-glue-converter';

const protoFile = 'path/to/your/schema.proto';
const glueSchema = convertProtoToGlueSchema(protoFile);

console.log(glueSchema);
```

### Default Type Mapping

The package uses the following default type mapping from Protobuf to AWS Glue:

| Protobuf Type | AWS Glue Type |
|---------------|---------------|
| double        | DOUBLE        |
| float         | FLOAT         |
| int64         | BIG_INT       |
| uint64        | BIG_INT       |
| int32         | INTEGER       |
| bool          | BOOLEAN       |
| string        | STRING        |
| bytes         | STRING        |
| enum          | STRING        |

### Custom Type Mapping

Provide custom type mappings for Protobuf to Glue schema conversion:

```typescript
import { convertProtoToGlueSchema, IProtoToGlueConfig } from 'proto-to-glue-converter';
import { Schema as glueSchema } from '@aws-cdk/aws-glue-alpha';

const config: IProtoToGlueConfig = {
  typeMapping: {
    int32: glueSchema.BIG_INT, // Map Protobuf int32 to Glue BIG_INT
  },
};

const protoFile = 'path/to/your/schema.proto';
const glueSchema = convertProtoToGlueSchema(protoFile, 'MessageName', config);

console.log(glueSchema);
```

### JSON Output

Convert the Glue schema to JSON format:

```typescript
import { convertProtoToJSONGlueSchema } from 'proto-to-glue-converter';

const protoFile = 'path/to/your/schema.proto';
const jsonSchema = convertProtoToJSONGlueSchema(protoFile, 'MessageName');

console.log(jsonSchema);
```

---

## 📚 API Reference

### `ProtoToGlueConverter`

The main class for converting Protobuf schemas to Glue schemas.

#### Constructor

```typescript
constructor(config?: IProtoToGlueConfig)
```

- `config`: Optional configuration object for custom type mappings.

#### Methods

- `generateGlueSchema(protoFile: string, messageName: string): Column[]`
  - Converts a Protobuf schema file to a Glue schema.
  - `protoFile`: Path to the `.proto` file.
  - `messageName`: specific message name to convert.

---

### `convertProtoToGlueSchema`

Convenience function for converting Protobuf schemas to Glue schemas.

```typescript
convertProtoToGlueSchema(protoFile: string, messageName: string, config?: IProtoToGlueConfig): Column[]
```

---

### `convertProtoToJSONGlueSchema`

Converts Protobuf schemas to JSON-formatted Glue schemas.

```typescript
convertProtoToJSONGlueSchema(protoFile: string, messageName: string, config?: IProtoToGlueConfig): IGlueJsonSchema[]
```

---

## 📋 Example

### Protobuf Schema (`example.proto`)

```proto
syntax = "proto3";

message User {
  string name = 1;
  int32 age = 2;
  repeated string hobbies = 3;
  Address address = 4;
}

message Address {
  string street = 1;
  string city = 2;
}
```

### TypeScript Code

```typescript
import { convertProtoToGlueSchema, convertProtoToJSONGlueSchema } from 'proto-to-glue-converter';

const protoFile = 'example.proto';

// Convert to Glue schema
const glueSchema = convertProtoToGlueSchema(protoFile, 'User');
console.log(glueSchema);

// Convert to JSON Glue schema
const jsonSchema = convertProtoToJSONGlueSchema(protoFile, 'User');
console.log(jsonSchema);
```

### Output

#### Glue Schema

```typescript
[
  { name: 'name', type: glueSchema.STRING },
  { name: 'age', type: glueSchema.INTEGER },
  { name: 'hobbies', type: glueSchema.array(glueSchema.STRING) },
  {
    name: 'address',
    type: glueSchema.struct([
      { name: 'street', type: glueSchema.STRING },
      { name: 'city', type: glueSchema.STRING },
    ]),
  },
]
```

#### JSON Glue Schema

```json
[
  { "name": "name", "type": "string" },
  { "name": "age", "type": "int" },
  { "name": "hobbies", "type": "array<string>" },
  {
    "name": "address",
    "type": "struct<street:string,city:string>"
  }
]
```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ using [protobufjs](https://github.com/protobufjs/protobuf.js) and [AWS CDK Glue Alpha](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-glue-alpha-readme.html).