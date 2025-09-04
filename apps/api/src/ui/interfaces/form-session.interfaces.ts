import { FormSessionData } from '../dto/form-session.dto';

/**
 * Interface pour typer la session Express
 */
export interface SessionWithFormData {
  formData?: FormSessionData;
  [key: string]: any;
}
