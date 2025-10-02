import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: number;
            username: string;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: number;
            username: string;
        };
    }>;
}
