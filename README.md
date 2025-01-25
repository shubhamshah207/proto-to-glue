# ProtoToGlueConverter

## Overview

`ProtoToGlueConverter` is a TypeScript utility for converting Protobuf schema definitions to AWS Glue table schemas, simplifying data schema migrations between Protocol Buffers and AWS Glue.

## Features

- Convert Protobuf message types to Glue schema columns
- Support for nested message types
- Handling of repeated (array) fields
- Circular reference detection

## Installation

```bash
npm install proto-to-glue
```

## Usage

### Basic Conversion

```typescript
import { convertProtoToGlueSchema } from './ProtoToGlueConverter';

const glueColumns = convertProtoToGlueSchema('./example.proto');
```

### Specific Message Conversion

```typescript
const specificMessageColumns = convertProtoToGlueSchema('./example.proto', 'SpecificMessage');
```

### JSON format glue schema Output (Can be directly used inside table schema)

```typescript
import { convertProtoToJSONGlueSchema } from './ProtoToGlueConverter';

const jsonSchema = convertProtoToJSONGlueSchema('./example.proto');
```

#### Output

```JSON
[{"name":"column1", "type":"STRING"}, {"name":"column2", "type":"INTEGER"}]
```

## Supported Types

### Fully Supported
- Primitive types (double, float, int32, int64)
- Boolean
- String
- Bytes
- Enum
- Nested message types
- Repeated fields

### Partial Support
- Complex nested structures
- Some advanced Protobuf type mappings

### Future Improvements
- [ ] Support for more complex Protobuf types
- [ ] Improved error handling for unsupported types
- [ ] Additional type inference mechanisms
- [ ] Performance optimizations for large schemas

## Type Mapping

| Protobuf Type | Glue Schema Type |
|--------------|-----------------|
| double       | DOUBLE          |
| float        | FLOAT           |
| int64        | BIG_INT         |
| int32        | INTEGER         |
| bool         | BOOLEAN         |
| string       | STRING          |
| bytes        | STRING          |
| enum         | STRING          |

## Error Handling

- Throws errors for unsupported field types
- Detects and prevents circular references
- Provides detailed error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License
MIT License


## Contact
shubhamshah207@gmail.com