import { api } from '../../api';
import { createDocumentApi } from './remote';
// Shared transport for mobile upload and Pleos status/evidence retrieval.
export const documentsApi = createDocumentApi(api);
