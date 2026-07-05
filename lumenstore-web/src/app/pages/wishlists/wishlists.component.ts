import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WishlistService } from '../../services/wishlist.service';
import { Wishlist } from '../../models';

@Component({
  selector: 'app-wishlists',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wishlists.component.html',
  styleUrls: ['./wishlists.component.scss'],
})
export class WishlistsComponent implements OnInit {
  wishlists: Wishlist[] = [];
  loading = false;

  constructor(
    private wishlistService: WishlistService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadWishlists();
  }

  loadWishlists() {
    const clientId = this.getClientId();
    if (clientId) {
      this.loading = true;
      this.wishlistService.getWishlistsByCustomer(clientId).subscribe(
        (wishlists: any) => {
          this.wishlists = wishlists;
          this.loading = false;
          this.cdr.detectChanges();
        },
        () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      );
    }
  }

  private getClientId(): number | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user).id : null;
  }
}
