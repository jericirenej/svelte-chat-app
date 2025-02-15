import { expect, type Locator, type Page } from "@playwright/test";
import { IMAGE_CROP, SIGNUP_MESSAGES } from "../../../messages";

class CropImageE2E {
  public readonly component: Locator;
  constructor(protected page: Page) {
    this.component = this.page.locator(".avatar-crop");
  }

  get confirmButton(): Locator {
    return this.component.getByRole("button", { name: IMAGE_CROP.confirm });
  }
  get resetButton(): Locator {
    return this.component.getByRole("button", { name: IMAGE_CROP.reset });
  }
  get cancelButton(): Locator {
    return this.component.getByRole("button", { name: IMAGE_CROP.cancel });
  }
}

class CroppedAvatarE2E {
  protected readonly component: Locator;
  constructor(protected page: Page) {
    this.component = this.page.locator(".cropped-avatar");
  }

  get oversizeWarning(): Locator {
    return this.component
      .getByRole("paragraph")
      .filter({ hasText: IMAGE_CROP.tooLarge("1").replace(/1.$/, "") });
  }
  get remove(): Locator {
    return this.component.getByTitle(IMAGE_CROP.remove);
  }

  get avatar(): Locator {
    return this.component.getByTitle(IMAGE_CROP.modify);
  }

  get avatarImg(): Locator {
    return this.avatar.locator("img");
  }

  async waitForImageLoad(): Promise<void> {
    await expect(this.avatarImg).toHaveJSProperty("complete", true);
  }
}

export class AddAvatarE2E {
  public readonly cropper: CropImageE2E;
  public readonly croppedAvatar: CroppedAvatarE2E;

  constructor(protected page: Page) {
    this.cropper = new CropImageE2E(this.page);
    this.croppedAvatar = new CroppedAvatarE2E(this.page);
  }

  get uploadButton(): Locator {
    return this.page.getByRole("button", { name: SIGNUP_MESSAGES.addAvatar });
  }

  async removeImage(): Promise<void> {
    await expect(this.croppedAvatar.remove).toBeVisible();
    await expect(this.croppedAvatar.remove).toBeEnabled();

    await this.croppedAvatar.remove.evaluate((el: HTMLButtonElement) => {
      el.click();
    });
    await expect(this.uploadButton).toBeVisible();
  }
  async confirmCrop(): Promise<void> {
    await this.clickCrop("confirm");
  }
  async cancelCrop(): Promise<void> {
    await this.clickCrop("cancel");
  }
  async resetCrop(): Promise<void> {
    await this.clickCrop("reset");
  }
  protected async clickCrop(type: "confirm" | "reset" | "cancel"): Promise<void> {
    const target = this.cropper[`${type}Button`];
    await expect(target).toBeVisible();
    await expect(target).toBeEnabled();
    await target.click();
    if (type !== "reset") {
      await expect(this.cropper.component).toBeHidden();
    }
  }
}
