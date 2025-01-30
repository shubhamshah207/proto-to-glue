# proto-to-glue

Convert Protocol Buffer schemas to AWS Glue catalog schemas with ease. This package simplifies the process of creating AWS Glue tables from your existing protobuf definitions, making it perfect for data lake and ETL workflows.

[![npm version](https://img.shields.io/npm/v/proto-to-glue.svg)](https://www.npmjs.com/package/proto-to-glue)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Coverage Status](https://coveralls.io/repos/github/shubhamshah207/proto-to-glue/badge.svg?branch=main)](https://coveralls.io/github/shubhamshah207/proto-to-glue?branch=main)
[![example workflow](https://github.com/shubhamshah207/proto-to-glue/actions/workflows/codeql.yml/badge.svg)](https://github.com/shubhamshah207/proto-to-glue/actions/workflows/codeql.yml)




## Features

- 🚀 Seamless conversion from .proto files to AWS Glue schemas
- 💪 Full support for nested message types
- 🔄 Handles repeated fields (arrays)
- ⚡ Compatible with AWS CDK
- 🛡️ Built-in circular reference detection
- 📦 Comprehensive type mapping
- 🎯 TypeScript support out of the box

## Installation

```bash
npm install proto-to-glue
# or
yarn add proto-to-glue
```

## Usage

### Basic Usage with AWS CDK

```typescript
import { convertProtoToGlueSchema } from 'proto-to-glue';
import * as glue from '@aws-cdk/aws-glue-alpha';

// In your CDK stack
const glueSchema = convertProtoToGlueSchema('path/to/schema.proto', 'YourMessageName');

new glue.Table(this, 'MyGlueTable', {
  columns: glueSchema,
  // ... other table properties
});
```

### Generate glue catalog schema in JSON format

```typescript
import { convertProtoToJSONGlueSchema } from 'proto-to-glue';

const jsonSchema = convertProtoToJSONGlueSchema('path/to/schema.proto', 'YourMessageName');
console.log(jsonSchema);
```

### Advanced Usage with Converter Class

```typescript
import { ProtoToGlueConverter } from 'proto-to-glue';

const converter = new ProtoToGlueConverter();
const schema = converter.generateGlueSchema('path/to/schema.proto', 'YourMessageName');
```

## Type Mapping

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

## Features in Detail

### Nested Message Support
The converter automatically handles nested message types by converting them to Glue struct types:

```protobuf
message Person {
  string name = 1;
  Address address = 2;
}

message Address {
  string street = 1;
  string city = 2;
}
```

### Array Support
Repeated fields in Protobuf are converted to Glue array types:

```protobuf
message Person {
  string name = 1;
  repeated string phones = 2;
}
```

### Circular Reference Detection
The package automatically detects and prevents circular references in your schema:

```protobuf
message A {
  B b = 1;  // Reference to B
}

message B {
  A a = 1;  // Circular reference will be detected
}
```

## Error Handling

The package provides comprehensive error handling for common scenarios:

- Invalid proto file paths
- Circular references
- Unsupported field types
- Missing message types

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT © Shubham Shah

## Support

- 📚 [Documentation](https://github.com/shubhamshah207/proto-to-glue/wiki)
- 🐛 [Issue Tracker](https://github.com/shubhamshah207/proto-to-glue/issues)
- 💬 [Discussions](https://github.com/shubhamshah207/proto-to-glue/discussions)